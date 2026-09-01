import {Queue} from "bullmq";

const strokeQueue = new Queue("stroke-persistence" , {
    connection : {
        url: process.env.REDIS_URL,
    },

    // this is for retry and backoff
    defaultJobOptions: {
        // total number of tries
        attempts: 3,

        // we dont keep trying immediately we give mongodb some time to recover
        backoff: {
            type: "exponential",
            delay: 1000,
        },
    },
});

export default strokeQueue;