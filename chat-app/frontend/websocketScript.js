import { saveEventData, render, geteventSnapshot } from "./common.js";

const WS_URL = "ws://localhost:3000";
/**
 * Updates message state to match the data from events.
 * @param {List of events} events - the events to process.
 */
function handleEvents(events) {
    events.forEach((event) => {
        const cursor = saveEventData(event);
        socket.send(JSON.stringify({ type: "ack", cursor }));
    });
    render();
}
let socket;

function connectWebSocket() {
    socket = new WebSocket(WS_URL);
    socket.addEventListener("open", (event) => {
        console.log("websocket connection opened...");
    });

    socket.addEventListener("message", (event) => {
        const messages = JSON.parse(event.data);
        handleEvents(messages);
    });

    socket.addEventListener("close", () => {
        console.log("websocket connection closed");
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
    const cursor = await geteventSnapshot();
    socket.send(JSON.stringify({ type: "ack", cursor }));
    render();
}

getSnapshot();
