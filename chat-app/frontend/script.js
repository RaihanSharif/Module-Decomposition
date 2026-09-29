import { HttpError } from "./HttpError.js";

const chatStreamDiv = document.querySelector(".chat-stream");
const form = document.querySelector(".chat-input");

// const BACKEND_URL =
//     "https://z4k2yzxetkpevkwf6zy9ea37.trainees.hosting.cyf.academy/";

const BACKEND_URL = "http://localhost:3000";

const state = {
    messages: new Map(),
    eventCursor: 0,
};

form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage();
    form.reset();
});

async function sendMessage() {
    const username = document.getElementById("username-input").value;
    const msg_body = document.getElementById("message-input").value;

    const message = { username: username, msg_body: msg_body };

    let responseMsg;
    try {
        responseMsg = await chatRequest(`${BACKEND_URL}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(message),
        });
    } catch (e) {
        alert(e.message);
    }

    // appends the sent message to the message list in in DOM.
    appendMessage(responseMsg);
}

const keepFetchingMessages = async () => {
    const queryString =
        state.lastMessageId > 0
            ? `?since=${state.lastMessageId}&wait=true`
            : "?wait=true";

    const url = `${BACKEND_URL}/messages${queryString}`;

    try {
        const messages = await chatRequest(url);
        messages.forEach(handleServerUpdate);
    } catch (e) {
        console.error("Polling failed: ", e);
        await new Promise((resolve) => setTimeout(resolve, 100));
        return keepFetchingMessages();
    }

    keepFetchingMessages();
};

/**
 *
 * @param {number} wait how long to wait. no wait or 0 = short polling
 */
async function pollEvents(wait) {
    let queryString = `?after=${state.eventCursor}`;
    if (wait) {
        queryString = queryString.concat(`&wait=${wait}`);
    }

    const url = `${BACKEND_URL}/events${queryString}`;
    console.log(url);

    try {
        const response = await chatRequest(url);
        console.log(response);
        state.eventCursor = response.cursor;
        console.log(response.events);
        handleEvents(response.events);
    } catch (e) {
        console.error(e.message);
    }
}

function handleEvents(events) {
    events.forEach((event) => {
        if (event.type === "message.created") {
            const message = event.data;
            state.messages.set(message.id, message);
        }
        render();
    });
}

function handleServerUpdate(payload) {
    if (payload.command === "new-message") {
        state.messages.push(payload.message);
        state.lastMessageId = payload.message.id;
        console.log(state.lastMessageId);
    } else if (payload.command === "reaction-update") {
        const message = state.messages.find((m) => m.id === payload.message.id);
        if (message) {
            message.likes = payload.message.likes;
            message.dislikes = payload.message.dislikes;
        }
    }
    render();
}

// TODO: render only new elements
function render() {
    const messages = state.messages.values();
    const messageEntries = messages.map((message) => {
        return createChatEntry(message);
    });
    chatStreamDiv.replaceChildren(...messageEntries);
}

function appendMessage(message) {
    const msgEntry = createChatEntry(message);
    chatStreamDiv.appendChild(msgEntry);
}

chatStreamDiv.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const { messageId, action } = button.dataset;

    try {
        const responseEvent = await reactToMessage(messageId, action);
        handleServerUpdate(responseEvent);
    } catch (e) {
        alert(e.message);
    }
});

function createChatEntry({
    id,
    username,
    msg_body,
    createdAt,
    likes,
    dislikes,
}) {
    const card = document.createElement("div");
    card.className = "message-card";

    const usernameElem = document.createElement("p");
    usernameElem.textContent = `from: ${username}`;

    const bodyElem = document.createElement("p");
    bodyElem.textContent = `message: ${msg_body}`;

    const timestampElem = document.createElement("p");
    timestampElem.textContent = `sent: ${createdAt}`;

    const likeBtn = document.createElement("button");
    likeBtn.textContent = `likes: ${likes}`;
    likeBtn.dataset.messageId = id;
    likeBtn.dataset.action = "like";

    const dislikeBtn = document.createElement("button");
    dislikeBtn.textContent = `dislikes: ${dislikes}`;
    dislikeBtn.dataset.messageId = id;
    dislikeBtn.dataset.action = "dislike";

    const btnContainer = document.createElement("div");
    btnContainer.className = "msg-btn-container";
    btnContainer.append(likeBtn, dislikeBtn);
    card.appendChild(usernameElem);
    card.appendChild(bodyElem);
    card.appendChild(timestampElem);
    card.appendChild(btnContainer);

    return card;
}

/**
 *
 * @param {string} messageId message to like or dislike
 * @param {string} action type of reaction (like or dislike initially)
 */
async function reactToMessage(messageId, action) {
    return await chatRequest(`${BACKEND_URL}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: messageId, action: action }),
    });
}

async function chatRequest(url, options) {
    const response = await fetch(url, options);

    let data;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        throw new HttpError(
            response.status,
            data?.error ?? "Something went wrong",
        );
    }

    return data;
}

// keepFetchingMessages();

pollEvents();
