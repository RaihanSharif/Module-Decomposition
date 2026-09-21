import dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

import express from "express";
import cors from "cors";

import { addMessage, getMessages, addReaction } from "./model.js";
const app = express();

app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;

const callbacksForNewMessages = [];

// if a "since" query is provided send only messages after the timestamp
// otherwise send all messages
app.get("/", (req, res) => {
    const timestamp = req.query.since;
    const wait = req.query.wait === "true";
    const newMessages = getMessages(timestamp);

    if (newMessages.length > 0) {
        const msgWithCommand = newMessages.map((msg) => {
            return { command: "new-message", message: msg };
        });
        return res.json(msgWithCommand);
    }

    if (!wait) {
        return res.json([]);
    }

    const callback = (value) => {
        if (!res.headersSent) res.json(value);
    };

    console.log(`[${Date.now()}] client registered, waiting`);
    callbacksForNewMessages.push(callback);

    req.on("close", () => {
        const idx = callbacksForNewMessages.indexOf(callback);
        if (idx !== -1) callbacksForNewMessages.splice(idx, 1);
    });
});

app.post("/", (req, res) => {
    try {
        const message = addMessage({
            username: req.body.username,
            msg_body: req.body.msg_body,
        });

        // wrap the message with a command type before putting in callback list
        // so when client gets data, can process accordingly
        const event = { command: "new-message", message: message };

        console.log(
            `[${Date.now()}] broadcasting reaction, ${callbacksForNewMessages.length} clients waiting`,
        );
        while (callbacksForNewMessages.length > 0) {
            const callback = callbacksForNewMessages.pop();
            callback([event]);
        }

        // client knows it's a message, doesn't need command type
        res.json(event);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.post("/react", (req, res) => {
    const data = addReaction(req.body.id, req.body.action);

    if (!data) {
        return res
            .status(404)
            .json({ error: "Message not found or invalid action" });
    }

    const event = { command: "reaction-update", message: data };

    console.log(
        `[${Date.now()}] broadcasting reaction, ${callbacksForNewMessages.length} clients waiting`,
    );
    while (callbacksForNewMessages.length > 0) {
        const callback = callbacksForNewMessages.pop();
        callback([event]);
    }

    res.json(event);
});

app.listen(PORT, () => {
    console.log(`chat app listening on port ${PORT}`);
});
