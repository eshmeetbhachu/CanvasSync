import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL;

const publisher = createClient({
    url:redisUrl,
})

const subscriber = publisher.duplicate();

const connectRedis = async() => {
    await publisher.connect();
    await subscriber.connect();
    console.log("redis connected");
}

export { publisher, subscriber, connectRedis };
