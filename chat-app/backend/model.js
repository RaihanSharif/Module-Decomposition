import { NotFoundError, ValidationError } from "./errorClasses.js";
import { Message } from "./Message.js";

const messages = [];

const MAX_USERNAME = 100;
const MAX_BODY = 500;

const dummyData = [];
dummyData.push(new Message("user1", "message1"));
dummyData.push(new Message("anotherUser", "second message"));
dummyData.push(new Message("b", "third message"));
dummyData.push(new Message("c", "fourth message"));
dummyData.push(new Message("d", "fifth message"));

messages.push(...dummyData);

/**
 * Creates a message, stores it, and returns it.
 * The id and timestamp are generated here; callers only supply content.
 *
 * @param {Object} input
 * @param {string} input.username - 1-100 characters.
 * @param {string} input.msg_body - 1-500 characters.
 * @returns {Message} The stored message.
 * @throws {Error} If username or body is missing, not a string, or out of range.
 */
function addMessage({ username, msg_body }) {
    if (!username) {
        throw new ValidationError("username is required");
    }

    if (!msg_body) {
        throw new ValidationError("msg_body is required");
    }

    if (typeof username !== "string" || typeof msg_body !== "string") {
        throw new ValidationError("username and body must be strings");
    }

    username = username?.trim();
    msg_body = msg_body?.trim();

    if (!username || username.length > MAX_USERNAME) {
        throw new ValidationError(
            `username must be 1-${MAX_USERNAME} characters`,
        );
    }
    if (!msg_body || msg_body.length > MAX_BODY) {
        throw new ValidationError(`body must be 1-${MAX_BODY} characters`);
    }

    const message = new Message(username, msg_body);

    messages.push(message);
    return message;
}

/**
 * Returns stored messages filtered by timestamp
 *
 * @param {number} messages with id > supplied id
 * @returns {Message[]} messages to send
 */
function getMessages(id) {
    if (id === undefined) {
        return messages;
    }

    if (!Number.isInteger(id) || id < 0) {
        throw new ValidationError("id must be a non-negative number");
    }

    return messages.filter((message) => message.id > id);
}

/**
 * Like or dislike a single message.
 *
 * @param {number} messageId id of message to react to
 * @param {string} action type of reaction currently "like" "dislike"
 * @returns {Message} the message with updated likes/dislikes
 */
function addReaction(messageId, action) {
    const message = messages.find((m) => m.id === messageId);
    if (!message) {
        throw new NotFoundError("Could not find message");
    }

    if (action === "like") {
        message.likes = (message.likes ?? 0) + 1;
    } else if (action === "dislike") {
        message.dislikes = (message.dislikes ?? 0) + 1;
    }

    return message;
}

export { addMessage, getMessages, addReaction };
