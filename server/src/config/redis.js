import { createClient } from "redis";

const publisher = createClient({
    url:"redis://localhost:6379",
})

const subscriber = publisher.duplicate();

const connectRedis = async() => {
    await publisher.connect();
    await subscriber.connect();
    console.log("redis connected");
}

export { publisher, subscriber ,connectRedis};
