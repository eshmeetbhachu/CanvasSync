import Tooltip from "./ui/Tooltip";
import { colorForUser } from "../utils/userColor";

const MAX_SHOWN = 4;

// Overlapping circles for the people on this board; the current user is listed first and marked "you".
function AvatarStack({ users, currentUserId }) {
    const ordered = [...users].sort((a, b) => (a.userId === currentUserId ? -1 : b.userId === currentUserId ? 1 : 0));
    const shown = ordered.slice(0, MAX_SHOWN);
    const hidden = ordered.slice(MAX_SHOWN);

    return (
        <div className="flex items-center" aria-label={`${users.length} ${users.length === 1 ? "person" : "people"} on this board`}>
            <div className="flex -space-x-2">
                {shown.map((person) => {
                    const isMe = person.userId === currentUserId;

                    return (
                        <Tooltip key={person.userId} label={isMe ? `${person.username} (you)` : person.username}>
                            <span
                                tabIndex={0}
                                aria-label={isMe ? `${person.username} (you)` : person.username}
                                className="flex size-9 items-center justify-center rounded-full border-2 border-paper font-display text-lg text-paper"
                                style={{ backgroundColor: colorForUser(person.userId) }}
                            >
                                {person.username?.[0]?.toUpperCase()}
                            </span>
                        </Tooltip>
                    );
                })}

                {hidden.length > 0 && (
                    <Tooltip label={hidden.map((person) => person.username).join(", ")}>
                        <span tabIndex={0} className="flex size-9 items-center justify-center rounded-full border-2 border-paper bg-bone text-xs font-medium text-ink">
                            +{hidden.length}
                        </span>
                    </Tooltip>
                )}
            </div>
        </div>
    );
}

export default AvatarStack;
