function OnlineUsers({ users, username }) {

    return (
        <div className="w-50 shrink-0 bg-white rounded-2xl shadow-lg p-4 h-fit">

            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-6">
                🟢 Online ({users.length})
            </h3>

            <div className="space-y-3">

                {users.map((user) => (

                    <div
                        key={user}
                        className="flex items-center gap-3"
                    >

                        <div className="relative">

                            <div
                                className="
                                    w-8
                                    h-8
                                    rounded-full
                                    bg-blue-100
                                    flex
                                    items-center
                                    justify-center
                                    font-bold
                                    text-blue-600
                                    text-lg
                                "
                            >
                                {user[0].toUpperCase()}
                            </div>

                            <div
                                className="
                                    absolute
                                    bottom-0
                                    right-0
                                    w-3
                                    h-3
                                    bg-green-500
                                    rounded-full
                                    border-2
                                    border-white
                                "
                            />

                        </div>

                        <div>

                            <p className="font-semibold text-gray-800">

                                {user}

                                {user === username && (

                                    <span
                                        className="
                                            ml-2
                                            text-xs
                                            bg-blue-100
                                            text-blue-600
                                            px-2
                                            py-1
                                            rounded-full
                                        "
                                    >
                                        You
                                    </span>

                                )}

                            </p>

                        </div>

                    </div>

                ))}

            </div>

        </div>
    );

}

export default OnlineUsers;