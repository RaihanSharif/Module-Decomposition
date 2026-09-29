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

 * @param {string} username - usrname of message creator. 1-100 characters.
 * @param {string} input.msg_body - Body of the message. 1-500 characters.
 * @returns {Message} The stored message.
 * @throws {ValidationError} If username or body is missing, not a string, or out of range.
 */
function addMessage(username, msg_body) {
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
 * Returns all messages in system.
 *
 * @returns {Message[]} An array of Message objects.
 */
function getMessages() {
    return messages;
}

/**
 * Return the message with the provided ID.
 *
 * @param {number} id - ID of message to return.
 * @returns {Message} The requested message.
 * @throws {ValidationError}  If id is invalid.
 * @throws {NotFoundError} If no messages exists with given ID.
 */
function getMessage(id) {
    validateId(id);

    const message = messages.find((message) => message.id === id);
    if (!message) {
        throw new NotFoundError("could not find message");
    }
    return message;
}

function validateId(id) {
    if (!Number.isInteger(id) || id < 0) {
        throw new ValidationError("id must be a non-negative number");
    }
}

/**
 * React to a message (currently like or dislike).
 *
 * @param {number} messageId ID of message to react to.
 * @param {string} action "like" or "dislike".
 * @returns {Message} the message with updated likes/dislikes.
 * @throws {ValidationError} if ID is invalid.
 * @throws {NotFoundError} if no message exists with given ID.
 *
 */
function addReaction(messageId, action) {
    const message = getMessage(messageId);

    if (action === "like") {
        message.likes = (message.likes ?? 0) + 1;
    } else if (action === "dislike") {
        message.dislikes = (message.dislikes ?? 0) + 1;
    }

    return message;
}

export { addMessage, getMessage, getMessages, addReaction };
