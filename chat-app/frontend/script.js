const chatStreamDiv = document.querySelector(".chat-stream");
const form = document.querySelector(".chat-input");

const BACKEND_URL = "http://localhost:3000";

const state = {
    messages: [],
    lastMessageId: 0,
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

    try {
        const response = await fetch(`{BACKEND_URL}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            throw new Error(`did not save to db`);
        }
    } catch (e) {
        alert(e.message);
    }
}

const keepFetchingMessages = async () => {
    const queryString =
        state.lastMessageId > 0
            ? `?since=${state.lastMessageId}&wait=true`
            : "?wait=true";

    const url = `${BACKEND_URL}/messages${queryString}`;

    const rawResponse = await fetch(url);
    const response = await rawResponse.json();

    response.forEach(handleServerUpdate);

    keepFetchingMessages();
};

function handleServerUpdate(payload) {
    if (payload.command === "new-message") {
        state.messages.push(payload.message);
        state.lastMessageId = payload.message.id;
        console.log(state.lastMessageId);
    } else if (payload.command === "reaction-update") {
        console.log(payload.message.id);
        const message = state.messages.find((m) => m.id === payload.message.id);
        if (message) {
            message.likes = payload.message.likes;
            message.dislikes = payload.message.dislikes;
        }
    }
    render();
}

// TODO: render only new elements
async function render() {
    const messageEntries = state.messages.map((message) => {
        return createChatEntry(message);
    });
    chatStreamDiv.replaceChildren(...messageEntries);
}

chatStreamDiv.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const { messageId, action } = button.dataset;

    try {
        const responseEvent = await reactToMessage(messageId, action);
        handleServerUpdate(responseEvent);
    } catch (e) {
        alert(`${e.message}. could not react!`);
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
    try {
        const response = await fetch(`${BACKEND_URL}/reactions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: messageId, action: action }),
        });
        if (!response.ok) {
            throw new Error(`${response.status}: could not get data`);
        }
        return await response.json();
    } catch (e) {
        throw new Error(e.message);
    }
}

keepFetchingMessages();
