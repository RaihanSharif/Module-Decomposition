import express from "express";

import { addMessage, getAllMessages } from "./model.js";
const app = express();

// TODO: later replace with env variable
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.json(getAllMessages());
});

app.post("/", (req, res) => {
    try {
        const message = addMessage({
            username: req.body.username,
            msg_body: req.body.msg_body,
        });
        res.status(201).json(message);
    } catch (e) {
        console.log(e.message);
        res.status(400).json({ error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`chat app listening on port ${PORT}`);
});
