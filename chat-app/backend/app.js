import express from "express";

import { addMessage, getAllMessages } from "./model.js";
const app = express();

// TODO: later replace with env variable
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded());

app.get("/", (req, res) => {
    res.json(getAllMessages());
});

app.post("/", (req, res) => {
    try {
        addMessage(req.body.username, req.body.msg_body);
    } catch (e) {
        res.send(`could not send: ${e.message}`);
    }
    res.redirect("/");
});

app.listen(PORT, () => {
    console.log(`chat app listening on port ${PORT}`);
});
