import { randomUUID } from "node:crypto";

const messages = [];

const MAX_USERNAME = 100;
const MAX_BODY = 500;

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
        username: "lol",
        body: "sdrgsdrg",
        timestamp: Date.now(),
    },
];

messages.push(...dummyData);

/**
 * @typedef {Object} Message
 * @property {string} id - UUID generated server-side.
 * @property {string} username
 * @property {string} msg_body
 * @property {number} timestamp - ISO 8601 UTC string.
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
        timestamp: new Date().toISOString(),
    };

    messages.push(message);
    return message;
}

/**
 *
 * @returns {Message[]} all saved messages
 */
function getAllMessages() {
    return messages;
}

export { addMessage, getAllMessages };
