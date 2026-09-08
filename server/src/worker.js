import "dotenv/config";

import { Worker } from "bullmq";
import { saveStroke } from "./services/board.service.js";

// The worker used to connect to MongoDB and Redis here when it ran as a
// separate process. It is now started by server.js so one Render service can
// host both Socket.IO and the BullMQ consumer.
// import connectDB from "./config/db.js";
// import { connectRedis } from "./config/redis.js";
// await connectDB();
// await connectRedis();

const startStrokeWorker = () => {
    const worker = new Worker(
        "stroke-persistence",
        async (job) => {
            console.log("JOB RECEIVED:", job.id);
            console.log("Job data:", job.data);

            const { roomId, stroke } = job.data;

            await saveStroke(roomId, stroke);

            console.log("JOB COMPLETED:", job.id);
        },
        {
            connection: {
                url: process.env.REDIS_URL,
            },
        }
    );

    worker.on("ready", () => {
        console.log("Worker connected to Redis");
    });

    worker.on("error", (error) => {
        console.error("Worker error:", error);
    });

    worker.on("failed", (job, error) => {
        console.error(
            `Job ${job?.id} failed on attempt ${job?.attemptsMade}`,
            error.message
        );
    });

    console.log("Stroke worker started in the server process");
    return worker;
};

export default startStrokeWorker;