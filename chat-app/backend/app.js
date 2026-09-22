import dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

import express from "express";
import cors from "cors";

import { addMessage, getMessages, addReaction } from "./model.js";
import { NotFoundError, ValidationError } from "./errorClasses.js";
const app = express();

app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;

const callbacksForNewMessages = [];

app.get("/messages", (req, res) => {
    const wait = req.query.wait === "true";
    let newMessages = getMessages();
    if (req.query.since) {
        newMessages = getMessages(Number(req.query.since));
    }

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

    callbacksForNewMessages.push(callback);

    req.on("close", () => {
        const idx = callbacksForNewMessages.indexOf(callback);
        if (idx !== -1) callbacksForNewMessages.splice(idx, 1);
    });
});

app.post("/messages", (req, res) => {
    const message = addMessage({
        username: req.body.username,
        msg_body: req.body.msg_body,
    });

    // wrap the message with a command type before putting in callback list
    // so when client gets data, can process accordingly
    const event = { command: "new-message", message: message };

    while (callbacksForNewMessages.length > 0) {
        const callback = callbacksForNewMessages.pop();
        callback([event]);
    }

    res.json(event);
});

app.post("/reactions", (req, res) => {
    const id = Number(req.body.id);
    if (!Number.isInteger(id) || id < 0) {
        throw new ValidationError("id number be a non-negative number");
    }

    if (req.body.action !== "like" && req.body.action !== "dislike") {
        throw new ValidationError("Invalid reaction");
    }

    const data = addReaction(Number(req.body.id), req.body.action);

    const event = { command: "reaction-update", message: data };

    while (callbacksForNewMessages.length > 0) {
        const callback = callbacksForNewMessages.pop();
        callback([event]);
    }

    res.json(event);
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

app.listen(PORT, () => {
    console.log(`chat app listening on port ${PORT}`);
});
