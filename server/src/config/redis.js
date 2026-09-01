import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL;

const publisher = createClient({
    url:redisUrl,
})

const subscriber = publisher.duplicate();

const client = createClient({
    url:redisUrl,
})

const connectRedis = async() => {
    await publisher.connect();
    await subscriber.connect();
    await client.connect();
    console.log("redis connected");
}

export { publisher, subscriber ,client ,connectRedis};
