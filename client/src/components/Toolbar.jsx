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
        <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
            Colors
        </h3>

            <div className="grid grid-cols-4 gap-3">
                {colors.map((color) => (
                    <button
                        key={color}
                        onClick={() => {
                            setSelectedColor(color);
                            currentColor.current = color;
                        }}
                        className={`
                            w-10 h-10 rounded-full transition duration-200
                            ${
                                selectedColor === color
                                    ? "ring-4 ring-blue-200 scale-110 shadow"
                                    : "hover:scale-110"
                            }
                        `}
                        style={{ backgroundColor: color }}
                    />
                ))}
            </div>
        </div>
    

        <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
            Brush Size
        </h3>

            <div className="flex flex-col gap-3">

                {brushSizes.map((size) => (
                    <button
                        key={size}
                        onClick={() => {
                            setSelectedBrushSize(size);
                            currentStrokeWidth.current = size;
                        }}
                        className={`
                            flex justify-center py-2 rounded-lg transition duration-200
                            ${
                                selectedBrushSize === size
                                    ? "bg-blue-50 ring-2 ring-blue-200"
                                    : "hover:bg-gray-100"
                            }
                        `}
                    >
                        <div
                            className="bg-black rounded-full"
                            style={{
                                width: `${size * 6}px`,
                                height: `${size}px`,
                            }}
                        ></div>
                    </button>
                ))}

            </div>
        </div>



        <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
                Actions
            </h3>

            <div className="grid grid-cols-2 gap-3">

                <button className="bg-gray-100 rounded-xl p-3 hover:bg-gray-200 transition" onClick={undo}>
                    Undo
                </button>

                <button className="bg-gray-100 rounded-xl p-3 hover:bg-gray-200 transition" onClick={redo}>
                    Redo
                </button>

            </div>
        </div>

        <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
                Tools
            </h3>

            <div className="grid grid-cols-2 gap-3">

                {tools.map((tool) => (
                    <button
                        key={tool.id}
                        onClick={() => {
                            setSelectedTool(tool.id);
                            currentTool.current = tool.id;
                        }}
                        className={`
                            rounded-xl
                            p-3
                            transition
                            duration-200
                            flex
                            justify-center
                            items-center
                            text-2xl
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