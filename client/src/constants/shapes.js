// Must match server/src/constants/shapes.js; the server rejects any label not on its list.
export const SHAPE_TYPES = ["circle", "rectangle", "diamond", "triangle", "line", "arrow"];

export const DRAWING_LABELS = [...SHAPE_TYPES, "other"];
