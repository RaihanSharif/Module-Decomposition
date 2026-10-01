import dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

import express from "express";
import cors from "cors";
import http from "http";
import { server as WebSocketServer } from "websocket";

import { addMessage, getMessages, addReaction, eventStream } from "./model.js";
import { NotFoundError, ValidationError } from "./errorClasses.js";
const app = express();

app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;

app.get("/messages", (req, res) => {
    res.json(getMessages());
});

app.post("/messages", (req, res) => {
    const message = addMessage(req.body.username, req.body.msg_body);

    res.status(201).json(message);
});

app.post("/reactions", (req, res) => {
    const id = toInteger(req.body.id);
    if (id === null) {
        throw new ValidationError("id must be a non-negative integer");
    }
    res.json(addReaction(id, req.body.action));
});

/**
 * Event streaming endpoint. Sends a list of events (new message, like, dislike) and
 * a cursor to the most recently sent event.
 * if request contains "after" query, sends events with sequence number higher than this.
 * if wait is supplied, does short polling, otherwise long polling that waits for the specified
 * amount of time in seconds.
 */
app.get("/events", async (req, res) => {
    const after = toInteger(req.query.after) ?? 0;
    const wait = toInteger(req.query.wait) ?? 0;

    if (wait === 0) {
        const events = eventStream.getAfter(after);
        const cursor =
            events.length > 0 ? events[events.length - 1].sequence : after;

        return res.json({ cursor, events });
    }

    const events = await eventStream.waitForEvents(after, wait * 1000);
    const cursor =
        events.length > 0 ? events[events.length - 1].sequence : after;

    res.json({ cursor, events });
});

app.get("/snapshot", (req, res) => {
    res.json({ cursor: eventStream.sequence, messages: getMessages() });
    console.log(`sent snapshot`);
});

app.use((err, req, res, next) => {
    if (err instanceof ValidationError) {
        return res.status(400).json({ error: err.message });
    }

    if (err instanceof NotFoundError) {
        return res.status(404).json({ error: err.message });
    }

    if (err instanceof Error) {
        return res.status(500).json({ error: "Internal server error" });
    }
});

function toInteger(value) {
    if (typeof value !== "string" || !/^\d+$/.test(value)) {
        return null;
    }
    const n = Number(value);
    return Number.isSafeInteger(n) ? n : null;
}

// WebSocket code

const server = http.createServer(app);

const webSocketServer = new WebSocketServer({
    httpServer: server,
});

webSocketServer.on("request", (request) => {
    const connection = request.accept(null, request.origin);

    const unsubscribe = eventStream.subscribe((event) => {
        connection.sendUTF(JSON.stringify(event));
    });

    connection.on("close", () => unsubscribe());
});

server.listen(PORT, () => {
    console.log(`chat app server listening on port ${PORT}`);
});
