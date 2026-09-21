import dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

import express from "express";
import cors from "cors";

import { addMessage, getAllMessages } from "./model.js";
const app = express();

app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;

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
