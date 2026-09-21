import { randomUUID } from "node:crypto";

const messages = [];

const MAX_USERNAME = 100;
const MAX_BODY = 500;

const dummyData = [
    {
        id: randomUUID(),
        username: "asdf",
        msg_body: "this is a random message",
        timestamp: 1790004060770,
        likes: 0,
        dislikes: 0,
    },
    {
        id: randomUUID(),
        username: "razz",
        msg_body: "hahasfesafae",
        timestamp: 1790004060870,
        likes: 10,
        dislikes: 0,
    },
    {
        id: randomUUID(),
        username: "shazzman",
        msg_body: "ret35gvre",
        timestamp: 1790004060970,
        likes: 50,
        dislikes: 2,
    },
    {
        id: randomUUID(),
        username: "wtf",
        msg_body: "ergs45sdgsdr",
        timestamp: 1790004061070,
        likes: 20,
        dislikes: 0,
    },
    {
        id: randomUUID(),
        username: "lol",
        msg_body: "sdrgsdrg",
        timestamp: 1790004061170,
        likes: 5,
        dislikes: 0,
    },
];

messages.push(...dummyData);

/**
 * @typedef {Object} Message
 * @property {string} id - UUID generated server-side.
 * @property {string} username
 * @property {string} msg_body
 * @property {string} timestamp - ISO 8601 UTC string.
 */

/**
 * Creates a message, stores it, and returns it.
 * The id and timestamp are generated here; callers only supply content.
 *
 * @param {Object} input
 * @param {string} input.username - 1-100 characters.
 * @param {string} input.body - 1-500 characters.
 * @returns {Message} The stored message.
 * @throws {Error} If username or body is missing, not a string, or out of range.
 */
function addMessage({ username, msg_body }) {
    if (typeof username !== "string" || typeof msg_body !== "string") {
        throw new Error("username and body must be strings");
    }

    username = username.trim();
    msg_body = msg_body.trim();

    if (!username || username.length > MAX_USERNAME) {
        throw new Error(`username must be 1-${MAX_USERNAME} characters`);
    }
    if (!msg_body || msg_body.length > MAX_BODY) {
        throw new Error(`body must be 1-${MAX_BODY} characters`);
    }

    const message = {
        id: randomUUID(),
        username,
        msg_body,
        timestamp: Date.now(),
        likes: 0,
        dislikes: 0,
    };

    messages.push(message);
    return message;
}

/**
 * Returns stored messages filtered by timestamp
 *
 * @param {number} timestamp
 * @returns {Message[]} messages to send
 */
function getMessages(timestamp) {
    if (timestamp) {
        return messages.filter((message) => message.timestamp > timestamp);
    }
    return messages;
}

function addReaction(messageId, action) {
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    if (action === "like") {
        message.likes = (message.likes ?? 0) + 1;
    }

    if (action === "dislike") {
        message.dislikes = (message.dislikes ?? 0) + 1;
    }

    return message;
}

export { addMessage, getMessages, addReaction };
