import "dotenv/config";

import { Worker } from "bullmq";
import { saveStroke } from "./services/board.service.js";

import connectDB from "./config/db.js";
import { connectRedis } from "./config/redis.js";

await connectDB();
await connectRedis();

const worker = new Worker(
    "stroke-persistence",
    async (job) => {
        console.log("JOB RECEIVED:", job.id);
        console.log("Job data:", job.data);

        const { roomId, stroke } = job.data;

        await saveStroke(roomId, stroke);

        console.log("OB COMPLETED:", job.id);
    },
    {
        connection: {
            host: "localhost",
            port: 6379,
        },
    }
);

worker.on("ready", () => {
    console.log("🟢 Worker connected to Redis");
});

worker.on("error", (error) => {
    console.error("🔴 Worker error:", error);
});

worker.on("failed", (job, error) => {
    console.error(
        `❌ Job ${job?.id} failed on attempt ${job?.attemptsMade}`,
        error.message
    );
});

console.log("Stroke worker started");