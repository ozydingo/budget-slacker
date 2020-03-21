const { PubSub } = require("@google-cloud/pubsub");

const SPEND_PATTERN = /\$?(\d+(?:\.\d{1,2})?)\s+(?:on\s+)?(.+?)(?:\s*:\s*(.*))$/;
const PUBSUB_TOPIC = process.env.pubsub_topic;

function parseSpend(text) {
  const match = text.match(SPEND_PATTERN);
  if (!match) { return {ok: false}; }
  const [, amount, category, note] = match;
  return {ok: true, expense: {amount, category, note}};
}

async function reportSpend(body) {
  const { token, response_url, team_id } = body;
  const data = { team_id };
  const command = "report";
  await publishEvent({ token, command, response_url, data });
  return "Crunching the numbers, hang tight!";
}

async function addExpense(body) {
  const { token, response_url, team_id, text, user_name, user_id } = body;
  const { ok, expense } = parseSpend(text);
  console.log({ ok, expense });
  if (!ok) { return "Invalid command format. Use \"$AMOUNT on CATEGORY: NOTE\""; }
  const timestamp = (new Date()).getTime();

  const { amount, category, note } = expense;
  const data = { timestamp, team_id, user_name, user_id, amount, category, note };
  const command = "spend";
  await publishEvent({ token, command, response_url, data });
  return `$${expense.amount} on ${expense.category}, got it!`;
}

async function publishEvent(data) {
  const client = new PubSub({projectId: process.env.GCP_PROJECT});
  const dataBuffer = Buffer.from(JSON.stringify(data));
  const messageId = await client.topic(PUBSUB_TOPIC).publish(dataBuffer);
  console.log(`Published message id ${messageId} to ${PUBSUB_TOPIC}`);
}

function commandHasData(text) {
  return /\w/.test(text);
}

// Main event function handler
exports.main = async (req, res) => {
  const { body, query } = req;
  console.log("Body", body);
  console.log("Query", query);

  if (commandHasData(body.text)) {
    const message = await addExpense(body);
    res.status(200).send(message);
  } else {
    const message = await reportSpend(body);
    res.status(200).send(message);
  }
};
