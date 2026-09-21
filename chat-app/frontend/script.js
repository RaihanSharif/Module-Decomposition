const chatStreamDiv = document.querySelector(".chat-stream");
const form = document.querySelector(".chat-input");

const BACKEND_URL = "http://localhost:3000";

form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage();
});

async function sendMessage() {
    const username = document.getElementById("username-input").value;
    const msg_body = document.getElementById("message-input").value;

    const message = { username: username, msg_body: msg_body };

    try {
        const response = await fetch("http://localhost:3000/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(message),
        });

        if (!response.status === 201) {
            throw new Error(`did not save to db`);
        }

        const data = await response.json();
        const chatEntry = createChatEntry(data);
        chatStreamDiv.appendChild(chatEntry);
    } catch (e) {
        alert(e.message);
    }
}

async function displayAllMessages() {
    try {
        const response = await fetch(BACKEND_URL);

        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const messages = await response.json();
        console.log(messages);
        chatStreamDiv.innerHTML = "";

        messages.forEach((message) => {
            chatStreamDiv.appendChild(createChatEntry(message));
        });
    } catch (e) {
        alert(e.message);
    }
}

function createChatEntry({ username, msg_body, timestamp }) {
    const card = document.createElement("div");

    const usernameElem = document.createElement("p");
    usernameElem.textContent = `from: ${username}`;

    const bodyElem = document.createElement("p");
    bodyElem.textContent = `message: ${msg_body}`;

    const timestampElem = document.createElement("p");
    timestampElem.textContent = `sent: ${timestamp}`;

    card.appendChild(usernameElem);
    card.appendChild(bodyElem);
    card.appendChild(timestampElem);

    card.className = "message-card";

    return card;
}

displayAllMessages();
