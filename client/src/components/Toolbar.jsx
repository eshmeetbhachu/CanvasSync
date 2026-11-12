import { useState } from "react";
import { LuDownload, LuEraser, LuPencil, LuRedo2, LuUndo2 } from "react-icons/lu";
import Popover from "./ui/Popover";
import Tooltip from "./ui/Tooltip";

// Must stay names or hex values the server's stroke validator accepts.
const COLORS = ["black", "red", "blue", "green", "yellow", "purple", "pink", "orange"];
const BRUSH_SIZES = [4, 6, 10, 15];

// `active` is only passed for toggle tools, so plain buttons do not announce a pressed state.
function ToolButton({ label, active, onClick, children, ...props }) {
    return (
        <Tooltip label={label}>
            <button
                aria-label={label}
                aria-pressed={active}
                onClick={onClick}
                className={`flex size-10 items-center justify-center rounded-full text-lg cursor-pointer transition-colors ${
                    active ? "bg-ink text-paper" : "text-ink hover:bg-sand"
                }`}
                {...props}
            >
                {children}
            </button>
        </Tooltip>
    );
}

const Divider = () => <span className="mx-1 h-6 w-px bg-bone" aria-hidden="true" />;

// Tool, colour and size live in refs owned by Canvas (read on every mouse move); local state only drives the highlight.
function Toolbar({ currentColor, currentStrokeWidth, currentTool, undo, redo, onExport }) {
    const [tool, setTool] = useState(currentTool.current);
    const [color, setColor] = useState(currentColor.current);
    const [size, setSize] = useState(currentStrokeWidth.current);

    const chooseTool = (next) => {
        currentTool.current = next;
        setTool(next);
    };

    return (
        <div role="toolbar" aria-label="Drawing tools" className="flex items-center gap-1 rounded-full border border-bone bg-paper px-2 py-1.5 shadow-md">
            <ToolButton label="Pencil" active={tool === "pencil"} onClick={() => chooseTool("pencil")}>
                <LuPencil aria-hidden="true" />
            </ToolButton>
            <ToolButton label="Eraser" active={tool === "eraser"} onClick={() => chooseTool("eraser")}>
                <LuEraser aria-hidden="true" />
            </ToolButton>

            <Divider />

            <Popover
                trigger={({ open, toggle }) => (
                    <ToolButton label="Colour" onClick={toggle} aria-haspopup="dialog" aria-expanded={open}>
                        <span className="size-5 rounded-full border border-bone" style={{ backgroundColor: color }} aria-hidden="true" />
                    </ToolButton>
                )}
            >
                {({ close }) => (
                    <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Colour">
                        {COLORS.map((name) => (
                            <button
                                key={name}
                                role="radio"
                                aria-checked={color === name}
                                aria-label={name}
                                onClick={() => {
                                    currentColor.current = name;
                                    setColor(name);
                                    chooseTool("pencil");
                                    close();
                                }}
                                className={`size-8 rounded-full cursor-pointer transition-transform hover:scale-110 ${
                                    color === name ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : ""
                                }`}
                                style={{ backgroundColor: name }}
                            />
                        ))}
                    </div>
                )}
            </Popover>

            <Popover
                trigger={({ open, toggle }) => (
                    <ToolButton label="Brush size" onClick={toggle} aria-haspopup="dialog" aria-expanded={open}>
                        <span className="rounded-full bg-ink" style={{ width: size + 2, height: size + 2 }} aria-hidden="true" />
                    </ToolButton>
                )}
            >
                {({ close }) => (
                    <div className="flex gap-1" role="radiogroup" aria-label="Brush size">
                        {BRUSH_SIZES.map((value) => (
                            <button
                                key={value}
                                role="radio"
                                aria-checked={size === value}
                                aria-label={`${value} pixels`}
                                onClick={() => {
                                    currentStrokeWidth.current = value;
                                    setSize(value);
                                    close();
                                }}
                                className={`flex size-10 items-center justify-center rounded-xl cursor-pointer ${
                                    size === value ? "bg-sand" : "hover:bg-sand/60"
                                }`}
                            >
                                <span className="rounded-full bg-ink" style={{ width: value + 2, height: value + 2 }} aria-hidden="true" />
                            </button>
                        ))}
                    </div>
                )}
            </Popover>

            <Divider />

            <ToolButton label="Undo" onClick={undo}>
                <LuUndo2 aria-hidden="true" />
            </ToolButton>
            <ToolButton label="Redo" onClick={redo}>
                <LuRedo2 aria-hidden="true" />
            </ToolButton>

            <Divider />

            <ToolButton label="Download as PNG" onClick={onExport}>
                <LuDownload aria-hidden="true" />
            </ToolButton>
        </div>
    );
}

export default Toolbar;
