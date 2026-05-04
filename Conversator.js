const ChatNode = require("./ChatNode");
const userConversations = require("./data/userConversations");

class Conversator {
  constructor(twiml, user) {
    this.twiml = twiml;
    this.user = user;
    if (!this.#hasConversation()) {
      this.#createConversation();
    }
  }
  #hasConversation() {
    return userConversations.find(
      (conversation) => conversation.user === this.user,
    );
  }
  #createConversation() {
    userConversations.push({
      user: this.user,
      lastMessageIdSentByServer: "menu-principal",
    });
  }

  #updateConversation(newId) {
    const indexToChange = userConversations.findIndex(
      (conversation) => conversation.user === this.user,
    );
    userConversations[indexToChange].lastMessageIdSentByServer = newId;
  }

  async respondTo(userMessage) {
    let nodeToSend;

    if (await ChatNode.performActionByUser(this.user, userMessage)) {
      nodeToSend = await ChatNode.getNextByUser(this.user, userMessage.Body);
    } else {
      nodeToSend = ChatNode.getLastByUser(this.user, userMessage.Body);
    }

    const output =
      typeof nodeToSend.body === "function"
        ? await nodeToSend.body(this.user, userMessage.Body)
        : nodeToSend.body;

    const messages = Array.isArray(output) ? output : [output];

    for (const text of messages) {
      if (text) this.twiml.message(text);
    }

    this.#updateConversation(nodeToSend.id);
  }
}

module.exports = Conversator;
