require("dotenv").config();
const express = require("express");
const { urlencoded } = require("body-parser");
const { MessagingResponse } = require("twilio").twiml;
const Conversator = require("./Conversator");
const twilio = require("twilio");
const axios = require("axios");

const app = express();
const port = 3000;

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

app.use(urlencoded({ extended: false }));

app.post("/whatsapp", async (req, res) => {
  const twiml = new MessagingResponse();

  const user = req.body.From;
  const userMessage = req.body;

  const conversator = new Conversator(twiml, user);
  await conversator.respondTo(userMessage);

  const phone = user.slice(-10);

  await axios.post(
    process.env.API_URL + "/chatbot/registro-de-ultimo-mensaje",
    {
      telefono: phone,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": process.env.API_SECRET,
        "X-From": phone,
      },
    },
  );

  res.type("text/xml").send(twiml.toString());
});

app.post("/send-proactive", express.json(), async (req, res) => {
  try {
    const { to, body } = req.body;

    if (!to) return res.status(400).json({ error: "Missing 'to'" });

    const msg = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to,
      body: body || "Mensaje proactivo de prueba",
    });

    res.json({ ok: true, sid: msg.sid });
  } catch (err) {
    res.status(500).json({
      ok: false,
      message: err.message,
      code: err.code,
      moreInfo: err.moreInfo,
    });
  }
});

app.get("/health", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.listen(process.env.PORT || port, () => {
  console.log(`Chatbot listening on port ${port}`);
});
