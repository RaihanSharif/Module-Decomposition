import dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

import express from "express";
import cors from "cors";

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
    const id = Number(req.body.id);

    if (typeof id !== "number") {
        throw new ValidationError("The id must be numeric");
    }
    if (!Number.isInteger(id) || id < 0) {
        throw new ValidationError("id number must be a non-negative number");
    }

    if (req.body.action !== "like" && req.body.action !== "dislike") {
        throw new ValidationError("Invalid reaction");
    }

    res.json(addReaction(id, req.body.action));
});

// events need a since and a wait for long polling
app.get("/events", async (req, res) => {
    const after = Number(req.query.after ?? 0);
    const wait = Number(req.query.wait ?? 0);

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
