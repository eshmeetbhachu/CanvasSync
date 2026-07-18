import Board from "../models/Board.js";

const saveStroke = async (roomId, stroke) => {
    await Board.findOneAndUpdate(
        {roomId},
        {
            $push : {
                strokes : stroke,
            },

            $setOnInsert : {
                roomId
            }
        },
        {
            upsert : true,
            new : true,
        }
    )
};

const loadBoard = async (roomId) => {
    const board = await Board.findOne({ roomId });
    // here if we find a room we send it otherwise we just send an empty array of strokes
    // useful because otherwise we would send null if no room
    // also we dont handle the case of no room because we dont want to show boards with no strokes on it like that would make 1000s of boards
    return board ?? { strokes: [] };
};

export { saveStroke , loadBoard };