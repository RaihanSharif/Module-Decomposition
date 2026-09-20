import express from "express";
const app = express();

// TODO: later replace with env variable
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
    res.json({ user: "Jason" });
});

app.listen(PORT, () => {
    console.log(`chat app listening on port ${PORT}`);
});
