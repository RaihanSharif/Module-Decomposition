const chatStreamDiv = document.querySelector(".chat-stream");
const form = document.querySelector(".chat-input");

const BACKEND_URL = "http://localhost:3000";

const state = {
    messages: [],
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
        const response = await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(message),
        });

        if (!response.status === 201) {
            throw new Error(`did not save to db`);
        }
    } catch (e) {
        alert(e.message);
    }
}

/*
Fetches messages continuously in intervals
If some messages already fetched, provide timestamp of last messages
as query paramter "?since=intervalMS"

Add newly fetched messages to the list of stored messages. 
and render all messages
*/
const keepFetchingMessages = async (intervalMS) => {
    const lastMessageTime =
        state.messages.length > 0
            ? state.messages[state.messages.length - 1].timestamp
            : null;
    const queryString = lastMessageTime
        ? `?since=${lastMessageTime}&wait=true`
        : "?wait=true";

    const url = `${BACKEND_URL}/${queryString}`;
    const rawResponse = await fetch(url);
    const response = await rawResponse.json();
    state.messages.push(...response);
    render();
    setTimeout(keepFetchingMessages, intervalMS);
};

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
    const data = await reactToMessage(messageId, action);

    if (action === "like") {
        button.textContent = `likes: ${data["likes"]}`;
    } else if (action === "dislike") {
        button.textContent = `dislikes: ${data["dislikes"]}`;
    }
});

function createChatEntry({
    id,
    username,
    msg_body,
    timestamp,
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
    timestampElem.textContent = `sent: ${new Date(timestamp).toISOString()}`;

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
        const response = await fetch(`${BACKEND_URL}/react`, {
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

keepFetchingMessages(100);
