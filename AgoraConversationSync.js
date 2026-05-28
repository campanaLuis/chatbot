/**
 * AgoraConversationSync.js
 *
 * Syncs WhatsApp conversations to AGORA so agents can see them in real time.
 * The chatbot keeps handling responses — this is read-only from the agent side.
 *
 * Env vars required:
 *   AGORA_API_URL    e.g. https://agora-govtech.whoopflow.com
 *   AGORA_API_TOKEN  user_access_token from AGORA profile settings
 *   AGORA_ACCOUNT_ID e.g. 1
 *   AGORA_INBOX_ID   ID of the Twilio WhatsApp inbox in AGORA
 */

const axios = require("axios");

const AGORA_URL     = process.env.AGORA_API_URL;
const AGORA_TOKEN   = process.env.AGORA_API_TOKEN;
const AGORA_ACCOUNT = process.env.AGORA_ACCOUNT_ID || "1";
const AGORA_INBOX   = process.env.AGORA_INBOX_ID;

function headers() {
  return {
    "Content-Type": "application/json",
    api_access_token: AGORA_TOKEN,
  };
}

function formatPhone(phone10digits) {
  const digits = String(phone10digits).replace(/\D/g, "");
  if (digits.length === 10) return `+52${digits}`;
  if (digits.length === 12 && digits.startsWith("52")) return `+${digits}`;
  return `+52${digits.slice(-10)}`;
}

/**
 * Find AGORA contact by phone. Returns contact or null.
 */
async function findContact(phone10) {
  const phone = formatPhone(phone10);
  try {
    const res = await axios.get(
      `${AGORA_URL}/api/v1/accounts/${AGORA_ACCOUNT}/contacts/search`,
      { params: { q: phone, page: 1 }, headers: headers() }
    );
    const contacts = res.data?.payload || [];
    return contacts.find((c) => c.phone_number === phone) || null;
  } catch (err) {
    console.error("[AgoraConvSync] findContact error:", err?.response?.data || err.message);
    return null;
  }
}

/**
 * Find open conversation for contact in the WhatsApp inbox.
 * Returns conversation or null.
 */
async function findOpenConversation(contactId) {
  try {
    const res = await axios.get(
      `${AGORA_URL}/api/v1/accounts/${AGORA_ACCOUNT}/contacts/${contactId}/conversations`,
      { headers: headers() }
    );
    const convs = res.data?.payload || [];
    return convs.find(
      (c) => c.inbox_id === parseInt(AGORA_INBOX) && c.status === "open"
    ) || null;
  } catch (err) {
    console.error("[AgoraConvSync] findOpenConversation error:", err?.response?.data || err.message);
    return null;
  }
}

/**
 * Create a new conversation in AGORA for this contact.
 */
async function createConversation(contactId) {
  try {
    const res = await axios.post(
      `${AGORA_URL}/api/v1/accounts/${AGORA_ACCOUNT}/conversations`,
      {
        inbox_id:   parseInt(AGORA_INBOX),
        contact_id: contactId,
        additional_attributes: { fuente: "chatbot_whatsapp" },
      },
      { headers: headers() }
    );
    console.log(`[AgoraConvSync] Conversation created: id=${res.data?.id}`);
    return res.data;
  } catch (err) {
    console.error("[AgoraConvSync] createConversation error:", err?.response?.data || err.message);
    return null;
  }
}

/**
 * Add a message to a conversation.
 * messageType: "incoming" (user) | "outgoing" (bot)
 */
async function addMessage(conversationId, content, messageType = "outgoing") {
  if (!content || !content.trim()) return;
  try {
    await axios.post(
      `${AGORA_URL}/api/v1/accounts/${AGORA_ACCOUNT}/conversations/${conversationId}/messages`,
      {
        content:      content.trim(),
        message_type: messageType,
        private:      false,
      },
      { headers: headers() }
    );
  } catch (err) {
    console.error("[AgoraConvSync] addMessage error:", err?.response?.data || err.message);
  }
}

/**
 * Extract text messages from TwiML XML string.
 * e.g. <Response><Message>Hello</Message></Response> → ["Hello"]
 */
function extractTwimlMessages(twimlStr) {
  const matches = twimlStr.match(/<Message[^>]*>([\s\S]*?)<\/Message>/gi) || [];
  return matches.map((m) => m.replace(/<[^>]+>/g, "").trim()).filter(Boolean);
}

/**
 * Main sync function — call this after the bot processes a message.
 *
 * @param {string} phone10     - 10-digit phone of the user
 * @param {string} userMessage - text the user sent
 * @param {string} twimlStr    - TwiML XML string with bot response(s)
 */
async function syncConversation(phone10, userMessage, twimlStr) {
  if (!AGORA_URL || !AGORA_TOKEN || !AGORA_INBOX) return;

  try {
    const contact = await findContact(phone10);
    if (!contact) return;

    let conversation = await findOpenConversation(contact.id);
    if (!conversation) {
      conversation = await createConversation(contact.id);
    }
    if (!conversation) return;

    const convId = conversation.id;

    // NOTE: incoming user message is handled natively by AGORA via /twilio/callback
    // Here we only add the bot's outgoing response(s)
    const botMessages = extractTwimlMessages(twimlStr);
    for (const msg of botMessages) {
      await addMessage(convId, msg, "outgoing");
    }
  } catch (err) {
    console.error("[AgoraConvSync] syncConversation error:", err.message);
  }
}

module.exports = { syncConversation };
