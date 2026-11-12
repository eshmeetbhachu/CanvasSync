import { drawStroke } from "./render.js";

const MARGIN = 40;
const BACKGROUND = "#FFFBF4";

// Bounding box of all strokes, including half the line width so thick strokes are not clipped.
export const strokesBounds = (strokes) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const stroke of strokes) {
        const pad = stroke.strokeWidth / 2;

        for (const { x, y } of stroke.points) {
            minX = Math.min(minX, x - pad);
            minY = Math.min(minY, y - pad);
            maxX = Math.max(maxX, x + pad);
            maxY = Math.max(maxY, y + pad);
        }
    }

    return minX === Infinity ? null : { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

export const safeFileName = (name) => (name || "board").replace(/[^a-z0-9 _-]+/gi, "").trim().replace(/\s+/g, "-") || "board";

// Draws the strokes, cropped to their bounds, onto a Floral White canvas and downloads it. Returns false if empty.
export const downloadBoardPng = (strokes, name) => {
    const bounds = strokesBounds(strokes);

    if (!bounds) return false;

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(bounds.width + MARGIN * 2);
    canvas.height = Math.ceil(bounds.height + MARGIN * 2);

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.translate(MARGIN - bounds.x, MARGIN - bounds.y);

    for (const stroke of strokes) drawStroke(ctx, stroke);

    const link = document.createElement("a");
    link.download = `${safeFileName(name)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    return true;
};
