import {
    saveEventData,
    render,
    chatRequest,
    geteventSnapshot,
    state,
} from "./common.js";

// const BACKEND_URL = "http://localhost:3000";

const BACKEND_URL =
    "https://z4k2yzxetkpevkwf6zy9ea37.trainees.hosting.cyf.academy";

/**
 * Updates message state to match the data from events.
 * @param {List of events} events - the events to process.
 */
function handleEvents(events) {
    events.forEach((event) => {
        saveEventData(event);
    });
    render();
}

/**
 * Continuously polls the event stream API for new messages or reactions.
 * Stores new messages or reactions in state.
 * If events fetched successfully, the event cursor state is updated.
 * Retries after 100ms if a request fails.
 *
 * @param {number} wait how long to wait. no wait or 0 = short polling
 */
async function pollEvents(wait) {
    let queryString = `?after=${state.eventCursor}`;
    if (wait) {
        queryString = queryString.concat(`&wait=${wait}`);
    }

    const url = `${BACKEND_URL}/events${queryString}`;
    try {
        const response = await chatRequest(url);
        state.eventCursor = response.cursor;
        handleEvents(response.events);
    } catch (e) {
        console.error("Polling failed: ", e);
        await new Promise((resolve) => setTimeout(resolve, 100));
        return pollEvents(wait);
    }

    pollEvents(wait);
}

geteventSnapshot();

pollEvents(30);
