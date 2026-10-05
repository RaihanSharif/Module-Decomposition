import dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

import { server as WebSocketServer } from "websocket";
import { eventStream } from "./model.js";
import http from "http";

const PORT = process.env.PORT || 3000;

import { app } from "./expressApp.js";

// express app handles http get requests for snapshots
// post requests to create new messages or reactions
// WebSocket used only for event streaming to the client
// and acknowledgement from the client when event received.
const server = http.createServer(app);

const webSocketServer = new WebSocketServer({
    httpServer: server,
});

webSocketServer.on("request", (request) => {
    const connection = request.accept(null, request.origin);

    const subscriber = eventStream.subscribe((events) => {
        connection.sendUTF(JSON.stringify(events));
    });

    connection.on("message", (message) => {
        const data = JSON.parse(message.utf8Data);
        if (data.type === "ack") {
            subscriber.cursor = data.cursor;
        }
    });

    connection.on("close", () => eventStream.unsubscribe(subscriber));
});

server.listen(PORT, () => {
    console.log(`chat app server listening on port ${PORT}`);
});
