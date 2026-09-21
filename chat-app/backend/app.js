import dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

import express from "express";
import cors from "cors";

import { addMessage, getMessages } from "./model.js";
const app = express();

app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;

// if a "since" query is provided send only messages after the timestamp
// otherwise send all messages
app.get("/", (req, res) => {
    const timestamp = req.query.since;
    console.log(`timestamp is ${timestamp}`);

    if (timestamp) {
        res.json(getMessages(timestamp));
        return;
    }
    res.json(getMessages());
});

app.post("/", (req, res) => {
    try {
        const message = addMessage({
            username: req.body.username,
            msg_body: req.body.msg_body,
        });
        res.status(201).json(message);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`chat app listening on port ${PORT}`);
});
