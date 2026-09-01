import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

// database connection
import connectDB from "./config/db.js";

import app from "./app.js";
import { PORT } from "./config/env.js";

// importing the registersocket
import registerSocket from "./sockets/index.js";
import { publisher, subscriber, connectRedis } from "./config/redis.js";
// importing the adapter function from the redis-adapter package
import { createAdapter } from "@socket.io/redis-adapter";

await connectDB();
await connectRedis();

// created the hhtp server
const server = http.createServer(app);

// ceated the socket server and allowed cors
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
  },
});

// the middleware to handle socket authentication
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    socket.data.userId = decoded.userId;

    next();
  } catch (error) {
    next(new Error("Invalid or expired token"));
  }
});

// tells socket.io to use this adapter
io.adapter(createAdapter(publisher, subscriber));

// run the redis subscriber function. this is manual way
// await startRedisSubscriber(io);

// made the connection code for the socket server
registerSocket(io);

// used the http server to start it and run it
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
