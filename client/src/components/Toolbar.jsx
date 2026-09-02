import { useState } from "react";

function Toolbar({
    currentColor,
    currentStrokeWidth,
    currentTool,
    undo,
    redo
}) {

    const [selectedColor, setSelectedColor] = useState("black");
    const [selectedTool, setSelectedTool] = useState("pencil");
    const [selectedBrushSize, setSelectedBrushSize] = useState(5);

    const colors = [
        "black",
        "red",
        "blue",
        "green",
        "yellow",
        "purple",
        "pink",
        "orange"
    ];

    const brushSizes = [4, 6, 10, 15];

    const tools = [
        {
            id: "pencil",
            icon: "✏️",
        },
        {
            id: "eraser",
            icon: "🩹",
        },
    ];

    return (
        <>
            {/* Colors */}

            <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Colors
                </h3>

                <div className="grid grid-cols-4 gap-2">
                    {colors.map((color) => (
                        <button
                            key={color}
                            onClick={() => {
                                setSelectedColor(color);
                                currentColor.current = color;
                            }}
                            className={`
                                w-8 h-8
                                rounded-full
                                transition duration-200
                                ${
                                    selectedColor === color
                                        ? "ring-3 ring-blue-200 scale-110 shadow"
                                        : "hover:scale-110"
                                }
                            `}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
            </div>


            {/* Brush Size */}

            <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Brush Size
                </h3>

                <div className="flex flex-col gap-2">
                    {brushSizes.map((size) => (
                        <button
                            key={size}
                            onClick={() => {
                                setSelectedBrushSize(size);
                                currentStrokeWidth.current = size;
                            }}
                            className={`
                                flex justify-center items-center
                                py-1
                                rounded-md
                                transition duration-200
                                ${
                                    selectedBrushSize === size
                                        ? "bg-blue-50 ring-1 ring-blue-200"
                                        : "hover:bg-gray-100"
                                }
                            `}
                        >
                            <div
                                className="bg-black rounded-full"
                                style={{
                                    width: `${size * 4}px`,
                                    height: `${Math.max(size / 2, 2)}px`,
                                }}
                            />
                        </button>
                    ))}
                </div>
            </div>


            {/* Actions */}

            <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Actions
                </h3>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        className="bg-gray-100 rounded-lg py-2 text-xs hover:bg-gray-200 transition"
                        onClick={undo}
                    >
                        Undo
                    </button>

                    <button
                        className="bg-gray-100 rounded-lg py-2 text-xs hover:bg-gray-200 transition"
                        onClick={redo}
                    >
                        Redo
                    </button>
                </div>
            </div>


            {/* Tools */}

            <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Tools
                </h3>

                <div className="grid grid-cols-2 gap-2">
                    {tools.map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => {
                                setSelectedTool(tool.id);
                                currentTool.current = tool.id;
                            }}
                            className={`
                                rounded-lg
                                py-3
                                transition duration-200
                                flex justify-center items-center
                                text-lg
                                ${
                                    selectedTool === tool.id
                                        ? "bg-blue-50 ring-2 ring-blue-500 scale-105"
                                        : "bg-gray-100 hover:bg-blue-100"
                                }
                            `}
                        >
                            {tool.icon}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}

export default Toolbar;