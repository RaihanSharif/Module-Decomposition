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
        return res.json(newMessages);
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

app.post("/", (req, res) => {
    try {
        const message = addMessage({
            username: req.body.username,
            msg_body: req.body.msg_body,
        });
        while (callbacksForNewMessages.length > 0) {
            const callback = callbacksForNewMessages.pop();
            callback([message]);
        }
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.post("/react", (req, res) => {
    const id = req.body.id;
    const action = req.body.action;
    const data = addReaction(id, action);
    res.json(data);
});

app.listen(PORT, () => {
    console.log(`chat app listening on port ${PORT}`);
});
