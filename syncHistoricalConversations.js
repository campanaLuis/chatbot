/**
 * syncHistoricalConversations.js
 *
 * Fetches all historical WhatsApp messages from Twilio and syncs them
 * to AGORA as conversations + messages.
 *
 * Usage:
 *   node syncHistoricalConversations.js
 *   node syncHistoricalConversations.js --dry-run
 *
 * Env vars (from .env):
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
 *   AGORA_API_URL, AGORA_API_TOKEN, AGORA_ACCOUNT_ID, AGORA_INBOX_ID
 */

require("dotenv").config();
const axios = require("axios");
const twilio = require("twilio");

const DRY_RUN = process.argv.includes("--dry-run");

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const AGORA_URL     = process.env.AGORA_API_URL;
const AGORA_TOKEN   = process.env.AGORA_API_TOKEN;
const AGORA_ACCOUNT = process.env.AGORA_ACCOUNT_ID || "1";
const AGORA_INBOX   = parseInt(process.env.AGORA_INBOX_ID);
const FROM_NUMBER   = process.env.TWILIO_WHATSAPP_FROM; // whatsapp:+14128662315

function agoraHeaders() {
  return { "Content-Type": "application/json", api_access_token: AGORA_TOKEN };
}

function formatPhone(twilioNumber) {
  // twilioNumber is like "whatsapp:+521234567890"
  return twilioNumber.replace("whatsapp:", "");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Twilio ──────────────────────────────────────────────────────────────────

async function fetchAllMessages() {
  console.log("Fetching messages from Twilio...");
  const messages = await twilioClient.messages.list({
    from: FROM_NUMBER,
    limit: 1000,
  });
  const inbound = await twilioClient.messages.list({
    to: FROM_NUMBER,
    limit: 1000,
  });
  const all = [...messages, ...inbound].sort(
    (a, b) => new Date(a.dateCreated) - new Date(b.dateCreated)
  );
  console.log(`  Total messages fetched: ${all.length}`);
  return all;
}

function groupByContact(messages) {
  const groups = {};
  for (const msg of messages) {
    const isIncoming = msg.direction === "inbound";
    const contactNumber = isIncoming
      ? formatPhone(msg.from)
      : formatPhone(msg.to);
    if (!groups[contactNumber]) groups[contactNumber] = [];
    groups[contactNumber].push(msg);
  }
  return groups;
}

// ─── AGORA ────────────────────────────────────────────────────────────────────

async function findContact(phone) {
  try {
    const res = await axios.get(
      `${AGORA_URL}/api/v1/accounts/${AGORA_ACCOUNT}/contacts/search`,
      { params: { q: phone, page: 1 }, headers: agoraHeaders() }
    );
    const contacts = res.data?.payload || [];
    return contacts.find((c) => c.phone_number === phone) || null;
  } catch {
    return null;
  }
}

async function createContact(phone) {
  try {
    const res = await axios.post(
      `${AGORA_URL}/api/v1/accounts/${AGORA_ACCOUNT}/contacts`,
      { name: phone, phone_number: phone, contact_type: 1,
        custom_attributes: { fuente: "chatbot_whatsapp" } },
      { headers: agoraHeaders() }
    );
    // Response format: { payload: { contact: {...} } } or just { id: ... }
    return res.data?.payload?.contact || res.data;
  } catch (err) {
    console.error(`  Error creating contact ${phone}:`, err?.response?.data);
    return null;
  }
}

async function findOrCreateConversation(contactId) {
  try {
    const res = await axios.get(
      `${AGORA_URL}/api/v1/accounts/${AGORA_ACCOUNT}/contacts/${contactId}/conversations`,
      { headers: agoraHeaders() }
    );
    const existing = (res.data?.payload || []).find(
      (c) => c.inbox_id === AGORA_INBOX
    );
    if (existing) return existing;
  } catch {}

  try {
    const res = await axios.post(
      `${AGORA_URL}/api/v1/accounts/${AGORA_ACCOUNT}/conversations`,
      { inbox_id: AGORA_INBOX, contact_id: contactId,
        additional_attributes: { fuente: "chatbot_whatsapp" } },
      { headers: agoraHeaders() }
    );
    return res.data;
  } catch (err) {
    console.error(`  Error creating conversation:`, err?.response?.data);
    return null;
  }
}

async function addMessage(conversationId, content, messageType, createdAt) {
  if (!content || !content.trim()) return;
  try {
    await axios.post(
      `${AGORA_URL}/api/v1/accounts/${AGORA_ACCOUNT}/conversations/${conversationId}/messages`,
      { content: content.trim(), message_type: messageType, private: false },
      { headers: agoraHeaders() }
    );
  } catch (err) {
    console.error(`  Error adding message:`, err?.response?.data?.error || err.message);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(DRY_RUN ? "[DRY RUN] No changes will be written." : "[LIVE] Syncing...");
  console.log();

  const messages   = await fetchAllMessages();
  const byContact  = groupByContact(messages);
  const phones     = Object.keys(byContact);

  console.log(`Contacts with messages: ${phones.length}`);
  console.log();

  let synced = 0;
  let skipped = 0;

  for (const phone of phones) {
    const msgs = byContact[phone];
    process.stdout.write(`  ${phone} (${msgs.length} msgs) → `);

    let contact = await findContact(phone);
    if (!contact) {
      if (!DRY_RUN) contact = await createContact(phone);
      else { console.log("would create contact"); skipped++; continue; }
    }
    if (!contact) { console.log("ERROR creating contact"); skipped++; continue; }

    if (DRY_RUN) {
      console.log(`contact id=${contact.id}, would sync ${msgs.length} messages`);
      synced++;
      continue;
    }

    const conversation = await findOrCreateConversation(contact.id);
    if (!conversation) { console.log("ERROR creating conversation"); skipped++; continue; }

    for (const msg of msgs) {
      const msgType = msg.direction === "inbound" ? "incoming" : "outgoing";
      await addMessage(conversation.id, msg.body, msgType, msg.dateCreated);
      await sleep(100); // avoid rate limiting
    }

    console.log(`OK (conv id=${conversation.id})`);
    synced++;
    await sleep(200);
  }

  console.log();
  console.log(`Done. Synced: ${synced} | Skipped/errors: ${skipped}`);
}

main().catch(console.error);
