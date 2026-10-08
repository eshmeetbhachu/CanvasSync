"""Run from the repo root:  ml/.venv/Scripts/python -m unittest discover -s ml/tests -v"""

import json
import sys
import tempfile
import unittest
from collections import Counter
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from build_dataset import build, split_people  # noqa: E402
from download_quickdraw import caps_per_category, keep, to_points  # noqa: E402
from labels import LABELS  # noqa: E402
from rasterize import rasterize  # noqa: E402

CONFIG = {
    "image_size": 64,
    "padding": 4,
    "line_width": 2,
    "seed": 42,
    "split": {"val_fraction": 0.15, "test_fraction": 0.15},
}


def ink_box(image):
    ys, xs = np.nonzero(image > 40)
    return xs.min(), xs.max(), ys.min(), ys.max()


def rectangle(width, height):
    return [[0, 0], [width, 0], [width, height], [0, height], [0, 0]]


class RasterizeTests(unittest.TestCase):
    def test_output_is_a_square_uint8_image(self):
        image = rasterize(rectangle(300, 200))

        self.assertEqual(image.shape, (64, 64))
        self.assertEqual(image.dtype, np.uint8)
        self.assertEqual(image.min(), 0)
        self.assertEqual(image.max(), 255)

    def test_flat_line_stays_flat_and_centred(self):
        left, right, top, bottom = ink_box(rasterize([[0, 0], [500, 0]]))

        self.assertLessEqual(bottom - top, 3, "a horizontal line must not be stretched vertically")
        self.assertGreaterEqual(right - left, 54, "the long side should fill the image minus padding")
        self.assertAlmostEqual((top + bottom) / 2, 31.5, delta=1.5)

    def test_vertical_line_stays_thin(self):
        left, right, top, bottom = ink_box(rasterize([[7, 0], [7, 900]]))

        self.assertLessEqual(right - left, 3)
        self.assertGreaterEqual(bottom - top, 54)

    def test_aspect_ratio_is_kept(self):
        for width, height in [(400, 100), (100, 400), (300, 300), (1000, 250)]:
            left, right, top, bottom = ink_box(rasterize(rectangle(width, height)))
            drawn_ratio = (right - left) / (bottom - top)

            self.assertAlmostEqual(drawn_ratio, width / height, delta=0.2 * width / height, msg=f"{width}x{height}")

    def test_padding_is_respected(self):
        left, right, top, bottom = ink_box(rasterize(rectangle(300, 300)))

        self.assertGreaterEqual(min(left, top), 2)
        self.assertLessEqual(max(right, bottom), 61)

    def test_position_and_size_on_the_canvas_do_not_matter(self):
        small_in_corner = rasterize([[5, 5], [25, 5], [25, 15], [5, 5]])
        big_elsewhere = rasterize([[1000, 2000], [1400, 2000], [1400, 2200], [1000, 2000]])

        np.testing.assert_array_equal(small_in_corner, big_elsewhere)

    def test_degenerate_strokes_are_rejected(self):
        self.assertIsNone(rasterize([[5, 5], [5, 5]]))
        self.assertIsNone(rasterize([[5, 5]]))
        self.assertIsNone(rasterize([]))

    def test_same_input_gives_same_image(self):
        points = [[0, 0], [30, 80], [90, 10], [0, 0]]

        np.testing.assert_array_equal(rasterize(points), rasterize(points))


class QuickDrawTests(unittest.TestCase):
    def test_converts_separate_x_and_y_lists_to_points(self):
        self.assertEqual(to_points([[[1, 2, 3], [4, 5, 6]]]), [[1, 4], [2, 5], [3, 6]])

    def test_keeps_only_recognized_single_stroke_drawings(self):
        stroke = [[0, 1], [0, 1]]

        self.assertTrue(keep({"recognized": True, "drawing": [stroke]}))
        self.assertFalse(keep({"recognized": False, "drawing": [stroke]}))
        self.assertFalse(keep({"recognized": True, "drawing": [stroke, stroke]}))
        self.assertFalse(keep({"recognized": True, "drawing": [[[0], [0]]]}))

    def test_label_cap_is_shared_between_its_categories(self):
        caps = caps_per_category({"circle": "circle", "squiggle": "other", "zigzag": "other", "star": "other"}, 2000)

        self.assertEqual(caps, {"circle": 2000, "squiggle": 666, "zigzag": 666, "star": 666})


class SplitTests(unittest.TestCase):
    PEOPLE = {f"person{i:02d}": 40 + i for i in range(20)}

    def test_every_person_is_in_exactly_one_split_and_all_splits_are_used(self):
        assignment = split_people(self.PEOPLE, 0.15, 0.15, seed=42)

        self.assertEqual(set(assignment), set(self.PEOPLE))
        self.assertEqual(set(assignment.values()), {"train", "val", "test"})

    def test_split_sizes_are_close_to_the_targets(self):
        assignment = split_people(self.PEOPLE, 0.15, 0.15, seed=42)
        drawings = Counter()

        for person, split in assignment.items():
            drawings[split] += self.PEOPLE[person]

        total = sum(self.PEOPLE.values())
        self.assertAlmostEqual(drawings["test"] / total, 0.15, delta=0.07)
        self.assertAlmostEqual(drawings["val"] / total, 0.15, delta=0.07)
        self.assertGreater(drawings["train"] / total, 0.6)

    def test_same_seed_gives_same_split_and_another_seed_differs(self):
        self.assertEqual(split_people(self.PEOPLE, 0.15, 0.15, seed=42), split_people(self.PEOPLE, 0.15, 0.15, seed=42))
        self.assertNotEqual(split_people(self.PEOPLE, 0.15, 0.15, seed=42), split_people(self.PEOPLE, 0.15, 0.15, seed=7))

    def test_few_equal_contributors_do_not_overfill_val_and_test(self):
        people = {f"p{i}": 230 for i in range(8)}
        splits = Counter(split_people(people, 0.15, 0.15, seed=42).values())

        self.assertEqual(splits, {"train": 6, "val": 1, "test": 1})

    def test_three_people_get_one_split_each(self):
        assignment = split_people({"a": 10, "b": 500, "c": 10}, 0.15, 0.15, seed=42)

        self.assertEqual(sorted(assignment.values()), ["test", "train", "val"])

    def test_fewer_than_three_people_is_an_error(self):
        with self.assertRaises(ValueError):
            split_people({"a": 100, "b": 100}, 0.15, 0.15, seed=42)


class BuildTests(unittest.TestCase):
    def make_inputs(self, root):
        collected = root / "collected.jsonl"
        quickdraw = root / "quickdraw"
        quickdraw.mkdir()

        with collected.open("w", encoding="utf-8") as out:
            number = 0
            for person in range(6):
                for label in LABELS:
                    for repeat in range(3):
                        number += 1
                        out.write(json.dumps({
                            "id": f"c{number}", "label": label, "user": f"user{person}", "session": "s",
                            "created_at": "2026-01-01T00:00:00+00:00",
                            "points": [[0, 0], [50 + repeat, 10 + person], [20, 60], [0, 0]],
                        }) + "\n")
            out.write(json.dumps({"id": "dot", "label": "circle", "user": "user0", "session": "s",
                                  "created_at": "2026-01-01T00:00:00+00:00", "points": [[3, 3], [3, 3]]}) + "\n")

        with (quickdraw / "circle.jsonl").open("w", encoding="utf-8") as out:
            for number in range(10):
                out.write(json.dumps({"id": f"qd-{number}", "label": "circle", "category": "circle",
                                      "points": [[0, 0], [255, 0], [255, 255], [0, 0]]}) + "\n")

        return collected, quickdraw

    def test_build_writes_a_consistent_versioned_dataset(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            collected, quickdraw = self.make_inputs(root)
            manifest = build("v1", collected, quickdraw, root / "datasets", CONFIG)
            target = root / "datasets" / "v1"

            self.assertEqual(manifest["skipped"], {"no extent (a dot)": 1})
            self.assertEqual(sum(manifest["splits"][s]["total"] for s in ("train", "val", "test")), 6 * 7 * 3 + 10)

            people = [set(manifest["splits"][s]["people"]) for s in ("train", "val", "test")]
            self.assertFalse(people[0] & people[1] or people[0] & people[2] or people[1] & people[2])
            self.assertEqual(len(people[0] | people[1] | people[2]), 6)

            for split in ("train", "val", "test"):
                with np.load(target / f"{split}.npz") as arrays:
                    images, label_ids = arrays["images"], arrays["labels"]
                rows = [json.loads(line) for line in (target / f"{split}.jsonl").read_text(encoding="utf-8").splitlines()]

                self.assertEqual(images.shape, (len(rows), 64, 64))
                self.assertEqual(images.dtype, np.uint8)
                self.assertEqual([LABELS[i] for i in label_ids], [row["label"] for row in rows])
                # the stored stroke really is the one the image was drawn from
                np.testing.assert_array_equal(images[0], rasterize(rows[0]["points"]))

                if split != "train":
                    self.assertTrue(all(row["source"] == "collected" for row in rows), "QuickDraw must stay in train")

            self.assertEqual(manifest["splits"]["train"]["per_source"]["quickdraw"], 10)
            self.assertEqual(json.loads((target / "manifest.json").read_text(encoding="utf-8"))["config"], CONFIG)

    def test_an_existing_version_is_never_overwritten(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            collected, quickdraw = self.make_inputs(root)
            build("v1", collected, quickdraw, root / "datasets", CONFIG)

            with self.assertRaises(FileExistsError):
                build("v1", collected, quickdraw, root / "datasets", CONFIG)

    def test_building_twice_from_the_same_inputs_gives_identical_data(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            collected, quickdraw = self.make_inputs(root)
            build("a", collected, quickdraw, root / "datasets", CONFIG)
            build("b", collected, quickdraw, root / "datasets", CONFIG)

            for split in ("train", "val", "test"):
                with np.load(root / "datasets" / "a" / f"{split}.npz") as first,                         np.load(root / "datasets" / "b" / f"{split}.npz") as second:
                    np.testing.assert_array_equal(first["images"], second["images"])
                    np.testing.assert_array_equal(first["labels"], second["labels"])
                self.assertEqual((root / "datasets" / "a" / f"{split}.jsonl").read_bytes(),
                                 (root / "datasets" / "b" / f"{split}.jsonl").read_bytes())


if __name__ == "__main__":
    unittest.main()
