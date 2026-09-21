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
    console.log("rendering...");
    const messageEntries = state.messages.map((message) => {
        return createChatEntry(message);
    });
    chatStreamDiv.replaceChildren(...messageEntries);
}

function createChatEntry({ username, msg_body, timestamp }) {
    const card = document.createElement("div");

    const usernameElem = document.createElement("p");
    usernameElem.textContent = `from: ${username}`;

    const bodyElem = document.createElement("p");
    bodyElem.textContent = `message: ${msg_body}`;

    const timestampElem = document.createElement("p");
    timestampElem.textContent = `sent: ${new Date(timestamp).toISOString()}`;

    card.appendChild(usernameElem);
    card.appendChild(bodyElem);
    card.appendChild(timestampElem);

    card.className = "message-card";

    return card;
}

keepFetchingMessages(100);
