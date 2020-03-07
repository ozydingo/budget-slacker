const axios = require("axios");
const { PubSub } = require("@google-cloud/pubsub");
const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");

const secretsClient = new SecretManagerServiceClient();
function accessSecret(versionString) {
  return secretsClient.accessSecretVersion({
    name: versionString
  }).then(response => {
    return response[0].payload.data.toString("utf8");
  });
}
const appTokenPromise = accessSecret(
  "projects/526411321629/secrets/slack-verification-token/versions/1"
);

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
  const { response_url, team_id } = body;
  const data = { team_id };
  const command = "budget";
  await publishEvent({ command, response_url, data });
  return "Crunching the numbers, hang tight!";
}

async function handleSpend(body) {
  console.log("Handling spend command");
  const { response_url, team_id, text, user_name, user_id } = body;
  const { ok, expense } = parseSpend(text);
  console.log({ ok, expense });
  if (!ok) { return "Invalid command format. Use \"$AMOUNT on CATEGORY: NOTE\""; }
  const timestamp = (new Date()).getTime();

  const { amount, category, note } = expense;
  const data = { timestamp, team_id, user_name, user_id, amount, category, note };
  const command = "spend";
  await publishEvent({ command, response_url, data });
  return `$${expense.amount} on ${expense.category}, got it!`;
}

async function publishEvent(data) {
  const client = new PubSub({projectId: PROJECT_ID});
  const dataBuffer = Buffer.from(JSON.stringify(data));
  const messageId = await client.topic(PUBSUB_TOPIC).publish(dataBuffer);
  console.log(`Published message id ${messageId} to ${PUBSUB_TOPIC}`);
}

async function requestOauth({team_id}) {
  const response = await axios({
    method: "post",
    url: process.env.requestOauthUrl,
    data: {team_id},
  });
  return response.data;
}

// Main event function handler
exports.main = async (req, res) => {
  const { body, query } = req;
  console.log("Body", body);
  console.log("Query", query);

  const { command, token } = body;
  const appToken = await appTokenPromise;
  if (token !== appToken) {
    console.log("Incorrect app token:", token);
    res.status(417).send("Who are you?");
    return;
  }

  let message;
  if (command === "/spend") {
    message = await handleSpend(body);
  } else if (command === "/budget") {
    message = await handleBudget(body);
  } else if (command === "/oauth") {
    // this can't actually happen, I'm just fooling lint because it makes me happy.
    message = await requestOauth(body);
  } else {
    message = `Command ${command} not recognized`;
  }

  res.status(200).send(message);
};
