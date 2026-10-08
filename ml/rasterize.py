"""Turn one stroke (a list of [x, y] points) into a fixed-size square image.

The app must apply exactly the same steps before running the model (Milestone 9),
so keep this file small and change it only together with the inference code.
"""

import numpy as np
from PIL import Image, ImageDraw

# Draw at this multiple of the final size, then shrink: gives smooth edges instead of jagged ones.
SUPERSAMPLE = 4


def rasterize(points, image_size=64, padding=4, line_width=2):
    """Return a (image_size, image_size) uint8 array, white stroke (255) on black (0).

    The stroke is cropped to its bounding box, scaled by ONE factor so its longest
    side fits inside the padding, and centred. The aspect ratio is never changed,
    so a flat line stays flat. Returns None for a stroke with no extent (a dot).
    """
    pts = np.asarray(points, dtype=np.float64)

    if pts.ndim != 2 or pts.shape[0] < 2 or pts.shape[1] != 2:
        return None

    low = pts.min(axis=0)
    extent = pts.max(axis=0) - low
    longest = extent.max()

    if longest <= 0:
        return None

    canvas = image_size * SUPERSAMPLE
    scale = (image_size - 2 * padding) * SUPERSAMPLE / longest
    # Centre the scaled bounding box; the shorter side gets the extra empty space.
    offset = (canvas - extent * scale) / 2
    # Whole pixels: otherwise 223.9999 and 224.0 land on different pixels and identical shapes differ.
    scaled = np.rint((pts - low) * scale + offset)

    image = Image.new("L", (canvas, canvas), 0)
    draw = ImageDraw.Draw(image)
    width = line_width * SUPERSAMPLE
    draw.line([tuple(p) for p in scaled], fill=255, width=width, joint="curve")

    # Round the two ends so short strokes do not end in square stubs.
    radius = width / 2
    for x, y in (scaled[0], scaled[-1]):
        draw.ellipse([x - radius, y - radius, x + radius, y + radius], fill=255)

    small = image.resize((image_size, image_size), Image.Resampling.BOX)

    return np.asarray(small, dtype=np.uint8)
