"""Shape names shared by every ML script. Must match server/src/constants/shapes.js."""

SHAPE_TYPES = ["circle", "rectangle", "diamond", "triangle", "line", "arrow"]

# "other" is the not-a-shape class.
LABELS = SHAPE_TYPES + ["other"]
