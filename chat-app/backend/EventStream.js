class EventStream {
    constructor() {
        this.events = [];
        this.sequence = 0;
        this.waiters = new Set();
        this.subscribers = new Set();
    }

    /**
     * Adds an event to the event stream. {sequnce, type, timestamp, data}.
     *
     * @param {"message.liked" | "message.disliked" | "message.created"} type - The type of event (e.g. "like").
     * @param {*} data - The message that was added or changed, and the changed fields.
     * @returns The event object, with a sequence number
     */
    append(type, data) {
        const event = {
            sequence: ++this.sequence,
            type,
            timestamp: Date.now(),
            data,
        };

        this.events.push(event);
        this.notifyWaiters();
        this.notifySubscribers();
        return event;
    }

    /**
     *
     * @param {number} sequence - returns events with sequence number > given sequence number.
     * @returns list of events.
     */
    getAfter(sequence) {
        return this.events.filter((event) => event.sequence > sequence);
    }

    subscribe(callback) {
        const subscriber = {
            cursor: null,
            callback: callback,
        };
        this.subscribers.add(subscriber);
        return subscriber;
    }

    unsubscribe(subscriber) {
        this.subscribers.delete(subscriber);
    }

    notifySubscribers() {
        for (const subscriber of this.subscribers) {
            if (subscriber.cursor === null) {
                continue;
            }

            const events = this.getAfter(subscriber.cursor);

            if (events.length === 0) {
                continue;
            }

            try {
                subscriber.callback(events);
            } catch (err) {
                console.error("subscriber failed", err);
            }
        }
    }

    /**
     * If no new events are available, keeps connection open for a while
     * @param {number} after - returns events after this sequence number.
     * @param {*} timeout - How long to wait for a new event before closing the connection.
     * @returns A promise which resolves with a list of new events or empty list
     * if timer expires.
     */
    waitForEvents(after, timeout = 30_000) {
        const existing = this.getAfter(after);

        if (existing.length > 0) {
            return Promise.resolve(existing);
        }

        return new Promise((resolve) => {
            const waiter = {
                after,
                resolve,
                timer: setTimeout(() => {
                    this.waiters.delete(waiter);
                    resolve([]);
                }, timeout),
            };

            this.waiters.add(waiter);
        });
    }

    /**
     * Sends new events for each waiting request, if there are any events to send.
     */
    notifyWaiters() {
        for (const waiter of this.waiters) {
            const events = this.getAfter(waiter.after);

            if (events.length === 0) {
                continue;
            }

            clearTimeout(waiter.timer);
            this.waiters.delete(waiter);
            waiter.resolve(events);
        }
    }
}

export { EventStream };
