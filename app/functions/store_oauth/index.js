const { google } = require("googleapis");

const { getSecret } = require("./getSecret");

// Do this on function initializaion; it doesn't change.
const credentialsPromise = getSecret(process.env.appCredentialsSecret);

// TODO: how to get this since it's self?
const redirect_url = "https://us-east1-budget-slacker.cloudfunctions.net/staging-store-oauth-function";

const clientPromise = credentialsPromise.then(credentials => {
  console.log("Got credentials:", credentials);
  const {client_secret, client_id} = credentials;
  const client = new google.auth.OAuth2(
    client_id, client_secret, redirect_url
  );
  console.log("Initialized client");
  return client;
});

async function getToken(code) {
  const client = await(clientPromise);
  console.log("Exchanging code", code);
  const token = await client.getToken(code);
  console.log("Got token", token);
  return token;
}

async function main(req, res) {
  const { code, state } = req.query;
  console.log({code, state});
  const tokenResponse = await getToken(code).catch(console.error);
  console.log(tokenResponse);

  res.status(200).send("ok");
}

module.exports = {
  main,
};
