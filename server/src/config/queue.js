import {Queue} from "bullmq";

const strokeQueue = new Queue("stroke-persistence" , {
    connection : {
        host: "localhost",
        port: 6379,
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