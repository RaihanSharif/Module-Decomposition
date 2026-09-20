const chatStreamDiv = document.querySelector(".chat-stream");

for (let i = 0; i < 40; i++) {
    const item = document.createElement("p");
    item.textContent = `${i} this is a practice message`;
    chatStreamDiv.appendChild(item);
}
