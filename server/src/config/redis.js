import { createClient } from "redis";

const publisher = createClient({
    url:"redis://localhost:6379",
})

const subscriber = publisher.duplicate();

const client = createClient({
    url:"redis://localhost:6379"
})

const connectRedis = async() => {
    await publisher.connect();
    await subscriber.connect();
    await client.connect();
    console.log("redis connected");
}

export { publisher, subscriber ,client ,connectRedis};
