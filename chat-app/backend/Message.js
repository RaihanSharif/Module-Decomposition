export class Message {
    static #nextId = 1;

    /**
     *
     * @param {string} username the message sender
     * @param {*} msg_body text content of the message
     */
    constructor(username, msg_body, likes = 0, dislikes = 0) {
        if (!username) {
            throw new Error("username is required");
        }

        if (!msg_body) {
            throw new Error("msg_body is required");
        }

        this.id = Message.#nextId++;
        this.username = username;
        this.msg_body = msg_body;
        this.createdAt = new Date();
        this.likes = likes;
        this.dislikes = dislikes;
    }
}
