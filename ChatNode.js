const userConversations = require("./data/userConversations");
const chatNodes = require("./data/chatNodes");

class ChatNode {
  static getById(id) {
    return chatNodes.find((node) => node.id == id);
  }
  static getLastByUser(user) {
    const id = userConversations.find(
      (conversation) => conversation.user === user,
    ).lastMessageIdSentByServer;
    const message = ChatNode.getById(id);
    return message;
  }

  //The next node often depends on the user reply
  static async getNextByUser(user, userMessage) {
    const lastNodeSent = ChatNode.getLastByUser(user);
    for (let i = 0; i < lastNodeSent.triggers.length; i++) {
      if (lastNodeSent.triggers[i].condition) {
        const result = await lastNodeSent.triggers[i].condition(
          user,
          userMessage,
        );
        if (!result) continue;
      }
      if (lastNodeSent.triggers[i].regex.test(userMessage))
        return ChatNode.getById(lastNodeSent.triggers[i].to.id);
    }
    return lastNodeSent;
  }

  static async performActionByUser(user, userMessage) {
    const lastNode = ChatNode.getLastByUser(user);
    if (lastNode.action) return await lastNode.action(user, userMessage);
    return true;
  }
}

module.exports = ChatNode;
