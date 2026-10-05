import express, { json } from "express";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function usernameMiddleware(req, res, next) {
    const username = req.get("X-username");
    req.username = username;
    console.log(username);
    next();
}

app.use(usernameMiddleware);

app.post("/", (req, res) => {
    let responseStr = "";
    if (req.username) {
        responseStr = `You are authenticated as ${req.username}.\n`;
    } else {
        responseStr = `You are not authenticated.\n`;
    }

    if (req.body) {
        console.log(req.body);
        responseStr = responseStr.concat(
            `You have requested information about ${req.body.length} subjects: ${req.body.join(", ")}.\n`,
        );
    }
    res.send(responseStr);
});

/*
previous CURL does not work because curl --data sends 'content-type: application/x-www-form-urlencoded', is not parsed by expres.json()
but by urlencoded(), which tries to create a key:value pair set rather than an array. 

By setting the content type explicitly, this can force the app to use the desired middleware:

curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -H "X-Username: Ahmed" \
  --data '["Bees", "birds", "lizards"]'
*/

app.listen(3000, () => {
    console.log(`Listening on port: 3000`);
});
