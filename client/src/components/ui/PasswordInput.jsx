import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import Input from "./Input";

function PasswordInput(props) {
    const [visible, setVisible] = useState(false);

    return (
        <Input
            {...props}
            type={visible ? "text" : "password"}
            trailing={
                <button
                    type="button"
                    onClick={() => setVisible((value) => !value)}
                    aria-label={visible ? "Hide password" : "Show password"}
                    className="flex size-8 items-center justify-center rounded-full text-olive cursor-pointer hover:bg-sand hover:text-ink"
                >
                    {visible ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
                </button>
            }
        />
    );
}

export default PasswordInput;
