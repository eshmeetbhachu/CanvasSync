// Single source for shape names: stroke metadata, the labeled-drawing endpoint and the ML labels all use it.
export const SHAPE_TYPES = ["circle", "rectangle", "diamond", "triangle", "line", "arrow"];

// "other" is the not-a-shape class the model learns alongside the real shapes.
export const DRAWING_LABELS = [...SHAPE_TYPES, "other"];
