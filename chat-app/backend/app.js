import express from "express";
import cors from "cors";

import { addMessage, getAllMessages } from "./model.js";
const app = express();

// TODO: later replace with env variable
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    const messages = getAllMessages();
    res.json(messages);
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
