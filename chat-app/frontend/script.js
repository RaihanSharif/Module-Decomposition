import { HttpError } from "./HttpError.js";

const chatStreamDiv = document.querySelector(".chat-stream");
const form = document.querySelector(".chat-input");

// const BACKEND_URL =
//     "https://z4k2yzxetkpevkwf6zy9ea37.trainees.hosting.cyf.academy";

const BACKEND_URL = "http://localhost:3000";
const WS_URL = "ws://localhost:3000";
const state = {
    messages: new Map(),
    eventCursor: 0,
};

form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage();
    form.reset();
});

/**
 * Send a message and append it to the messages DOM.
 * Does not update the messages state or cursor.
 * That is done by the event polling.
 */
async function sendMessage() {
    const username = document.getElementById("username-input").value;
    const msg_body = document.getElementById("message-input").value;

    try {
        await chatRequest(`${BACKEND_URL}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, msg_body }),
        });
    } catch (e) {
        alert(e.message);
    }
}

/**
 * Updates message state to match the data from events.
 * @param {List of events} events - the events to process.
 */
function handleEvents(events) {
    events.forEach((event) => {
        const message = event.data;
        if (event.type === "message.created") {
            state.messages.set(message.id, message);
        }
        if (event.type === "message.liked") {
            if (message) {
                const stateMsg = state.messages.get(message.id);
                stateMsg.likes = message.likes;
            }
        }
        if (event.type === "message.disliked") {
            if (message) {
                const stateMsg = state.messages.get(message.id);
                stateMsg.dislikes = message.dislikes;
            }
        }
        state.eventCursor = event.sequence;
        socket.send(JSON.stringify({ type: "ack", cursor: state.eventCursor }));
    });
    render();
}

// Render all messages.
function render() {
    const messages = state.messages.values();
    const messageEntries = messages.map((message) => {
        return createChatEntry(message);
    });
    chatStreamDiv.replaceChildren(...messageEntries);
}

// Append a single message to the current list of messages in the DOM.
function appendMessage(message) {
    const msgEntry = createChatEntry(message);
    chatStreamDiv.appendChild(msgEntry);
}

/**
 * Even listener to handle clicks of like/dislike buttons.
 */
chatStreamDiv.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const { messageId, action } = button.dataset;

    try {
        await reactToMessage(messageId, action);
    } catch (e) {
        alert(e.message);
    }
});

// Create a message card to display in DOM.
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
 * Sends the reaction type and the id of the message reacted to.
 *
 * @param {string} messageId message to like or dislike
 * @param {string} action type of reaction (like or dislike initially)
 * @returns {id, likes | dislikes} Returns the id and the value of the reaction field.
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

// pollEvents(30);

let socket;

function connectWebSocket() {
    socket = new WebSocket(WS_URL);
    socket.addEventListener("open", (event) => {
        console.log("connection opened...");
    });

    socket.addEventListener("message", (event) => {
        const messages = JSON.parse(event.data);
        handleEvents(messages);
        console.log("At message handler, received: ", messages);
    });

    socket.addEventListener("close", () => {
        console.log("websocket closed");
        setTimeout(() => {
            connectWebSocket();
        }, 1000);
    });

    socket.addEventListener("error", (error) => {
        console.error("WebSocket error:", error);
    });
}

connectWebSocket();

async function getSnapshot() {
    console.log(`snapshot...`);
    const response = await chatRequest(`${BACKEND_URL}/snapshot`);
    const messages = response.messages;
    messages.forEach((msg) => {
        state.messages.set(msg.id, msg);
    });
    state.eventCursor = response.cursor;
    socket.send(JSON.stringify({ type: "ack", cursor: state.eventCursor }));
    render();
}

getSnapshot();
