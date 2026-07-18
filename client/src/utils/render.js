export const drawStroke = (ctx, stroke) => {

    if (stroke.points.length === 0) return;

    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.strokeWidth;

    ctx.beginPath();

    const firstPoint = stroke.points[0];

    ctx.moveTo(firstPoint.x, firstPoint.y);

    for (let i = 1; i < stroke.points.length; i++) {

        const point = stroke.points[i];

        ctx.lineTo(point.x, point.y);

    }

    ctx.stroke();
};

export const drawBoard = (
    ctx,
    canvas,
    board,
    currentStroke
) => {

    ctx.clearRect(
        0,
        0,
        canvas.strokeWidth,
        canvas.height
    );

    for (const stroke of board) {
        drawStroke(ctx, stroke);
    }

    if (currentStroke) {
        drawStroke(ctx, currentStroke);
    }
};
