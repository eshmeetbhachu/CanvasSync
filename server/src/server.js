import http from "http";
import { Server } from "socket.io";

// database connection
import connectDB from "./config/db.js";

import app from "./app.js";
import { PORT } from "./config/env.js";

// importing the registersocket
import registerSocket from "./sockets/index.js";
import { publisher,subscriber, connectRedis } from "./config/redis.js";
// importing the adapter function from the redis-adapter package
import { createAdapter } from "@socket.io/redis-adapter";

await connectDB();
await connectRedis();

// created the hhtp server
const server = http.createServer(app);

// ceated the socket server and allowed cors
const io = new Server(server,{
    cors:{
        origin:"http://localhost:5173",
    },
});

// tells socket.io to use this adapter 
io.adapter(createAdapter(publisher,subscriber));

// run the redis subscriber function. this is manual way
// await startRedisSubscriber(io);

// made the connection code for the socket server
registerSocket(io);

// used the http server to start it and run it
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});