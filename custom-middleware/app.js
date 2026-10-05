import express from "express";

const app = express();

function usernameMiddleware(req, res, next) {
    const username = req.get("X-username");
    req.username = username;
    next();
}

function parseBodyAsJSONArray(req, res, next) {
    const chunks = [];

    req.on("data", (chunk) => {
        chunks.push(chunk);
    });

    req.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf8");

        try {
            const parsed = JSON.parse(raw);

            if (!Array.isArray(parsed)) {
                return res.status(400).send("Body must be a JSON array");
            }

            if (parsed.some((elem) => typeof elem !== "string")) {
                return res
                    .status(400)
                    .send("All elements in array must be strings");
            }

            req.body = parsed;
            next();
        } catch (e) {
            return res.status(400).send("Invalid JSON string");
        }
    });

    req.on("error", (err) => {
        next(err);
    });
}

app.use([usernameMiddleware, parseBodyAsJSONArray]);
app.post("/", (req, res) => {
    let responseStr = "";
    if (req.username) {
        responseStr = `You are authenticated as ${req.username}.\n`;
    } else {
        responseStr = `You are not authenticated.\n`;
    }

    if (req.body) {
        responseStr = responseStr.concat(
            `You have requested information about ${req.body.length} subjects: ${req.body.join(", ")}.\n`,
        );
    }

    res.send(responseStr);
});

app.listen(3000, () => {
    console.log(`Listening on port: 3000`);
});
