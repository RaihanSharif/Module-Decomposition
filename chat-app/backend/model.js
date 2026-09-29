import { NotFoundError, ValidationError } from "./errorClasses.js";
import { Message } from "./Message.js";
import { EventStream } from "./EventStream.js";

const messages = [];
const eventStream = new EventStream();

const MAX_USERNAME = 100;
const MAX_BODY = 500;

const dummyData = [];
dummyData.push({ username: "user1", msg_body: "abcd" });
dummyData.push({ username: "user2", msg_body: "xyz" });
dummyData.push({ username: "user3", msg_body: "lmno" });
dummyData.push({ username: "user4", msg_body: "pqrst" });

dummyData.forEach(({ username, msg_body }) => {
    addMessage(username, msg_body);
});

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
    eventStream.append("message.created", message);
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

const REACTIONS = {
    like: { reactionType: "likes", event: "message.liked" },
    dislike: { reactionType: "dislikes", event: "message.disliked" },
};

/**
 * Adds a reaction (like or dislike) to a message.
 *
 * @param {number} messageId ID of the message to react to.
 * @param {"like" | "dislike"} action The reaction to add.
 * @returns {{ id: number, likes?: number, dislikes?: number }}
 *   The message id and its updated count for the given reaction.
 * @throws {ValidationError} if `action` is not a known reaction.
 * @throws {NotFoundError} if no message exists with the given ID.
 */
function addReaction(messageId, action) {
    if (typeof action !== "string" || !Object.hasOwn(REACTIONS, action)) {
        throw new ValidationError(
            `Unknown reaction type: ${String(action).slice(0, 50)}`,
        );
    }

    const { reactionType, event } = REACTIONS[action];

    const message = getMessage(messageId);
    message[reactionType] = (message[reactionType] ?? 0) + 1;

    const data = { id: message.id, [reactionType]: message[reactionType] };
    eventStream.append(event, data);
    return data;
}

export {
    addMessage,
    getMessage,
    getMessages,
    addReaction,
    eventStream,
    REACTIONS,
};
