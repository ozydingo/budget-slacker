const { PubSub } = require("@google-cloud/pubsub");

const PROJECT_ID = process.env.GCP_PROJECT;
const SPEND_PATTERN = /\$?(\d+(?:\.\d{1,2})?)\s+(?:on\s+)?(.+?)(?:\s*:\s*(.*))$/;
const PUBSUB_TOPIC = process.env.pubsub_topic;

function parseSpend(text) {
  const match = text.match(SPEND_PATTERN);
  if (!match) { return {ok: false}; }
  const [, amount, category, note] = match;
  return {ok: true, expense: {amount, category, note}};
}

async function handleBudget(body) {
  console.log("Handling budget command");
  const { token, response_url, team_id } = body;
  const data = { team_id };
  const command = "budget";
  await publishEvent({ token, command, response_url, data });
  return "Crunching the numbers, hang tight!";
}

async function handleSpend(body) {
  console.log("Handling spend command");
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
  const client = new PubSub({projectId: PROJECT_ID});
  const dataBuffer = Buffer.from(JSON.stringify(data));
  const messageId = await client.topic(PUBSUB_TOPIC).publish(dataBuffer);
  console.log(`Published message id ${messageId} to ${PUBSUB_TOPIC}`);
}

// Main event function handler
exports.main = async (req, res) => {
  const { body, query } = req;
  console.log("Body", body);
  console.log("Query", query);

  const { command } = body;
  let message;
  if (command === "/spend") {
    message = await handleSpend(body);
  } else if (command === "/budget") {
    message = await handleBudget(body);
  } else if (command === "/budget-slacker-test-oauth") {
    message = await handleBudget({response_url:  body.response_url, team_id: "TEST-OAUTH"});
  } else {
    message = `Command ${command} not recognized`;
  }

  res.status(200).send(message);
};
