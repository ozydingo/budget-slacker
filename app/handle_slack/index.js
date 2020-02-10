const { PubSub } = require("@google-cloud/pubsub");

const APP_TOKEN = process.env.app_token;
const PROJECT_ID = "budget-slacker";
const SPEND_PATTERN = /\$?(\d+(?:\.\d{1,2})?)\s+(?:on\s+)?(.+?)(?:\s*:\s*(.*))$/;
const PUBSUB_TOPIC = "slack-event";

function verifyToken(token) {
  return token === APP_TOKEN;
}

function parseSpend(text) {
  const match = text.match(SPEND_PATTERN);
  if (!match) { return {ok: false}; }
  const [, amount, category, note] = match;
  return {ok: true, spendData: {amount, category, note}};
}

function spendMessage({ ok, spendData }) {
  if (ok) {
    return `$${spendData.amount} on ${spendData.category}, got it!`;
  } else {
    return "Invalid command format. Use \"$AMOUNT on CATEGORY: NOTE\"";
  }
}

async function handleSpend({ ok, spendData }) {
  console.log("Handling spend command");
  console.log({ ok, spendData });
  if (!ok) { return; }

  const client = new PubSub({projectId: PROJECT_ID});
  const dataBuffer = Buffer.from(JSON.stringify(spendData));
  const messageId = await client.topic(PUBSUB_TOPIC).publish(dataBuffer);
  console.log(`Published message id ${messageId} to ${PUBSUB_TOPIC}`);
}

// Main event function handler
exports.main = async (req, res) => {
  const { body, query } = req;
  console.log("Body", body);
  console.log("Query", query);

  const { command, token } = body;
  if (!verifyToken(token)) {
    console.log("Incorrect app token:", token);
    res.status(417).send("Who are you?");
    return;
  }

  let message;
  if (command === "/spend") {
    const { text } = body;
    const { ok: spendOk, spendData } = parseSpend(text);
    await handleSpend({ ok: spendOk, spendData });
    message = spendMessage({ ok: spendOk, spendData });
  } else {
    message = `Command ${command} not recognized`;
  }

  res.status(200).send(message);
};
