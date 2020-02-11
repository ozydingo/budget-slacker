const { PubSub } = require("@google-cloud/pubsub");

const APP_TOKEN = "FkMG5PVzNLX8o6KniWxLzD23";
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
  return {ok: true, expense: {amount, category, note}};
}

async function handleSpend(body) {
  console.log("Handling spend command");
  const { response_url, team_id, text, user_name, user_id } = body;
  const { ok, expense } = parseSpend(text);
  console.log({ ok, expense });
  if (!ok) { return "Invalid command format. Use \"$AMOUNT on CATEGORY: NOTE\""; }

  const slackMessage = { response_url, team_id, user_name, user_id }
  const client = new PubSub({projectId: PROJECT_ID});
  const dataBuffer = Buffer.from(JSON.stringify({ expense, slackMessage }));
  const messageId = await client.topic(PUBSUB_TOPIC).publish(dataBuffer);
  console.log(`Published message id ${messageId} to ${PUBSUB_TOPIC}`);
  return `$${expense.amount} on ${expense.category}, got it!`;
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
    message = await handleSpend(body);
  } else {
    message = `Command ${command} not recognized`;
  }

  res.status(200).send(message);
};
