import Board from "../models/Board.js";
//importung the redis client for cache.
import {client} from "../config/redis.js"

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

    // adding the updating redis to remove cache invalidation section
    const key = `room:${roomId}:strokes`
    const cachedBoard = await client.get(key);

    if(cachedBoard){
        const strokes = JSON.parse(cachedBoard);

        strokes.push(stroke);

        await client.set(
            key,
            JSON.stringify(strokes)
        )
    }
};

const loadBoard = async (roomId) => {

    // the redis cache methods.
    const key = `room:${roomId}:strokes`;

    // checking redis first.
    const cachedBoard = await client.get(key);

    // cache hit
    if(cachedBoard){
        console.log("Cache Hit!")

        return {
            strokes: JSON.parse(cachedBoard)
        };
    }

    // in case of cache miss.
    console.log("Cache Miss!")
    const board = await Board.findOne({ roomId });
    // here if we find a room we send it otherwise we just send an empty array of strokes
    // useful because otherwise we would send null if no room
    // also we dont handle the case of no room because we dont want to show boards with no strokes on it like that would make 1000s of boards
    const strokes = board?.strokes ?? [];
    
    await client.set(
        key,
        JSON.stringify(strokes)
    );

    return {
        strokes
    };
    
};

const deleteStroke = async (roomId, strokeId) => {
    await Board.findOneAndUpdate(
        { roomId },
        {
            $pull: {
                strokes: {
                    id: strokeId,
                },
            },
        }
    );
};

const undoStroke = async (roomId) => {
    await Board.findOneAndUpdate(
        { roomId },
        {
            $pop: {
                strokes: 1,
            },
        }
    );
};

const redoStroke = async (roomId,restoredStroke) => {
    await Board.findOneAndUpdate(
        {roomId},
        {
            $push: {
                strokes: restoredStroke,
            }
        }
    )
}

export { saveStroke , loadBoard , deleteStroke , undoStroke ,redoStroke};