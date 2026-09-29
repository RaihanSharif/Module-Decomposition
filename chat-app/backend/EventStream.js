class EventStream {
    constructor() {
        this.events = [];
        this.sequence = 0;
        this.waiters = new Set();
    }

    append(type, data) {
        const event = {
            sequence: ++this.sequence,
            type,
            timestamp: Date.now(),
            data,
        };

        this.events.push(event);
        this.notifyWaiters();

        return event;
    }

    getAfter(sequence) {
        return this.events.filter((event) => event.sequence > sequence);
    }

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
