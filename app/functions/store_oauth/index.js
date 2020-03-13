const { google } = require("googleapis");

const { getSecret } = require("./getSecret");
const { invokeFunction } = require("./invoke_function");

// Do this on function initializaion; it doesn't change.
const credentialsPromise = getSecret(process.env.appCredentialsSecret);

// TODO: how to get this since it's self?
const redirect_url = "https://us-east1-budget-slacker.cloudfunctions.net/staging-store-oauth-function";

const clientPromise = credentialsPromise.then(app_credentials => {
  const {client_secret, client_id} = app_credentials;
  const client = new google.auth.OAuth2(
    client_id, client_secret, redirect_url
  );
  return client;
});

async function getToken(code) {
  console.log("Exchanging code for tokens");
  const client = await(clientPromise);
  const token = await client.getToken(code);
  return token;
}

async function storeTokens(team_id, tokens) {
  console.log(`Storing tokens for team ${team_id}`);
  await invokeFunction(process.env.teamsUrl, {
    action: "update",
    team_id,
    tokens
  });
}

async function setupTeam(team_id, tokens) {
  const app_credentials = await credentialsPromise;
  await invokeFunction(process.env.setupUrl, {
    app_credentials,
    team_id,
    tokens
  });
}

async function main(req, res) {
  const { code, state } = req.query;
  console.log("Got oauth code with state",  state);
  const team_id = JSON.parse(state).team_id;
  const tokenResponse = await getToken(code).catch(console.error);
  if (!tokenResponse.tokens) { throw new Error("Unable to get tokens. Response:", tokenResponse); }
  const { tokens } = tokenResponse;

  await Promise.all([
    setupTeam(team_id, tokens),
    storeTokens(team_id, tokens),
  ]);

  res.status(200).send("ok");
}

module.exports = {
  main,
};
