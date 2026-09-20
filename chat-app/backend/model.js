import { randomUUID } from "node:crypto";

const messages = [];

const dummyData = [
    {
        id: randomUUID(),
        username: "asdf",
        body: "this is a random message",
        timestamp: Date.now(),
    },
    {
        id: randomUUID(),
        username: "razz",
        body: "hahasfesafae",
        timestamp: Date.now(),
    },
    {
        id: randomUUID(),
        username: "shazzman",
        body: "ret35gvre",
        timestamp: Date.now(),
    },
    {
        id: randomUUID(),
        username: "wtf",
        body: "ergs45sdgsdr",
        timestamp: Date.now(),
    },
    {
        id: randomUUID(),
        useranme: "lol",
        body: "sdrgsdrg",
        timestamp: Date.now(),
    },
];

messages.push(...dummyData);

/**
 * Adds a message to the list of messages
 *
 * @param {String} username username of message sender
 * @param {String} body message body
 * @returns message {id, username, body, timestamp}
 */
function addMessage(username, body) {
    if (!username?.trim() || !body?.trim()) {
        throw new Error("username and message body are required");
    }

    const id = randomUUID();
    const date = Date.now();
    const message = { id, username, body, timestamp: date };
    messages.push(message);
    return message;
}

/**
 *
 * @returns List - copy of the currently stored messages
 */
function getAllMessages() {
    return [...messages];
}

export { addMessage, getAllMessages };
