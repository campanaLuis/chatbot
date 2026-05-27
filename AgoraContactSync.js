/**
 * AgoraContactSync.js
 *
 * Dual-write helper: after every persona creation/update in the legacy backend,
 * this module upserts the same data into AGORA contacts using custom_attributes
 * for the extra fields (no schema changes required).
 *
 * Env vars required:
 *   AGORA_API_URL    e.g. https://agora-govtech.whoopflow.com
 *   AGORA_API_TOKEN  user_access_token from AGORA profile settings
 *   AGORA_ACCOUNT_ID e.g. 1
 */

const axios = require("axios");

const AGORA_URL     = process.env.AGORA_API_URL;
const AGORA_TOKEN   = process.env.AGORA_API_TOKEN;
const AGORA_ACCOUNT = process.env.AGORA_ACCOUNT_ID || "1";

// Map chatbot field names → AGORA custom_attribute keys
const FIELD_MAP = {
  codigopostal:              "codigopostal",
  colonia:                   "colonia",
  twitter_handle:            "twitter",
  instagram_handle:          "instagram",
  facebook_handle:           "facebook",
  tiktok_handle:             "tiktok",
  intereses_text:            "intereses",
  intereses_voice_note_url:  "intereses_voice_note_url",
  sexo:                      "sexo",
  fechadenacimiento:         "fecha_de_nacimiento",
  profesion:                 "profesion",
  origen:                    "origen",
};

// Fields that map to top-level AGORA contact fields (not custom_attributes)
const TOP_LEVEL_MAP = {
  nombre: "name",
  selfie_url: "avatar_url",
};

function agoraHeaders() {
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
 * Find existing AGORA contact by phone number.
 * Returns the contact object or null.
 */
async function findContactByPhone(phone10) {
  if (!AGORA_URL || !AGORA_TOKEN) return null;
  const phone = formatPhone(phone10);
  try {
    const res = await axios.get(
      `${AGORA_URL}/api/v1/accounts/${AGORA_ACCOUNT}/contacts/search`,
      {
        params: { q: phone, page: 1 },
        headers: agoraHeaders(),
      }
    );
    const contacts = res.data?.payload || [];
    return contacts.find((c) => c.phone_number === phone) || null;
  } catch (err) {
    console.error("[AgoraSync] findContactByPhone error:", err?.response?.data || err.message);
    return null;
  }
}

/**
 * Create a new AGORA contact.
 */
async function createContact(phone10, nombre) {
  if (!AGORA_URL || !AGORA_TOKEN) return null;
  const nameParts = String(nombre || "").trim().split(" ");
  try {
    const res = await axios.post(
      `${AGORA_URL}/api/v1/accounts/${AGORA_ACCOUNT}/contacts`,
      {
        name:         nameParts[0] || "Sin nombre",
        last_name:    nameParts.slice(1).join(" ") || "",
        phone_number: formatPhone(phone10),
        contact_type: 1,
        custom_attributes: { fuente: "chatbot_whatsapp" },
      },
      { headers: agoraHeaders() }
    );
    console.log(`[AgoraSync] Contact created: id=${res.data?.id}`);
    return res.data;
  } catch (err) {
    console.error("[AgoraSync] createContact error:", err?.response?.data || err.message);
    return null;
  }
}

/**
 * Update an existing AGORA contact (merge custom_attributes).
 */
async function updateContact(contactId, payload) {
  if (!AGORA_URL || !AGORA_TOKEN) return null;
  try {
    const res = await axios.patch(
      `${AGORA_URL}/api/v1/accounts/${AGORA_ACCOUNT}/contacts/${contactId}`,
      payload,
      { headers: agoraHeaders() }
    );
    console.log(`[AgoraSync] Contact updated: id=${contactId}`);
    return res.data;
  } catch (err) {
    console.error("[AgoraSync] updateContact error:", err?.response?.data || err.message);
    return null;
  }
}

/**
 * Called when chatbot creates a new persona.
 * Upserts the contact in AGORA.
 */
async function syncCrearPersona(phone10, nombre) {
  try {
    let contact = await findContactByPhone(phone10);
    if (contact) {
      const nameParts = String(nombre || "").trim().split(" ");
      await updateContact(contact.id, {
        name:      nameParts[0] || contact.name,
        last_name: nameParts.slice(1).join(" ") || contact.last_name,
        custom_attributes: {
          ...contact.custom_attributes,
          fuente: "chatbot_whatsapp",
        },
      });
    } else {
      await createContact(phone10, nombre);
    }
  } catch (err) {
    console.error("[AgoraSync] syncCrearPersona error:", err.message);
  }
}

/**
 * Called when chatbot updates a single field on a persona.
 * Finds the contact and merges the field into AGORA.
 *
 * @param {string} phone10  - 10-digit phone
 * @param {string} field    - chatbot field name (e.g. "codigopostal")
 * @param {*}      value    - the new value
 */
async function syncModificarPersona(phone10, field, value) {
  if (value === null || value === undefined || value === "") return;
  try {
    const contact = await findContactByPhone(phone10);
    if (!contact) return;

    const payload = {};

    if (TOP_LEVEL_MAP[field]) {
      payload[TOP_LEVEL_MAP[field]] = value;
    } else if (FIELD_MAP[field]) {
      payload.custom_attributes = {
        ...contact.custom_attributes,
        [FIELD_MAP[field]]: value,
      };
    } else {
      // Unknown field — store as-is in custom_attributes
      payload.custom_attributes = {
        ...contact.custom_attributes,
        [field]: value,
      };
    }

    await updateContact(contact.id, payload);
  } catch (err) {
    console.error("[AgoraSync] syncModificarPersona error:", err.message);
  }
}

module.exports = { syncCrearPersona, syncModificarPersona };
