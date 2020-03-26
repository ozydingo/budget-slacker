const axios = require("axios");
const crypto = require("crypto");
// const { google } = require("googleapis");
const querystring = require("querystring");

// const { getSecret } = require("./getSecret");
const { invokeFunction } = require("./invoke_function.js");
const responses = require("./responses.js");

// const SCOPES = [
//   "https://www.googleapis.com/auth/drive.readonly",
//   "https://www.googleapis.com/auth/drive.file"
// ];
// const oauthRedirectUri = process.env.handleOauthUrl;

// Do this on function initializaion; it doesn't change.
// const credentialsPromise = getSecret(process.env.appCredentialsSecret);

function messageSlack({response_url, data}) {
  console.log("Responding to Slack");
  return axios({
    method: "POST",
    url: response_url,
    data,
  }).then(response => {
    console.log("Slack response:", response.status);
  });
}

// function getAuthUrl({app_credentials, state}) {
//   const {client_secret, client_id} = app_credentials;
//   const oAuth2Client = new google.auth.OAuth2(
//     client_id, client_secret, oauthRedirectUri
//   );
//
//   const authUrl = oAuth2Client.generateAuthUrl({
//     access_type: "offline",
//     scope: SCOPES,
//     prompt: "consent",
//     state,
//   });
//
//   return authUrl;
// }

function generatePerishableToken(bytes = 64) {
  return crypto.randomBytes(bytes).toString("hex");
}

function generateExpirationTime(minutes = 15) {
  return (new Date()).getTime() + minutes * 60 * 1000;
}

async function main(req, res) {
  const { response_url, team_id } = req.body;
  const oauth_nonce = generatePerishableToken();
  const oauth_nonce_expiration = generateExpirationTime();
  console.log("Generated new nonce expiring at", oauth_nonce_expiration);
  await invokeFunction(process.env.teamsUrl, {
    action: "update",
    team_id,
    oauth_nonce,
    oauth_nonce_expiration,
  });

  const state = JSON.stringify({team_id, oauth_nonce});
  console.log("OAuth request state:", state);

  // const app_credentials = await credentialsPromise;
  // const oauthUrl = getAuthUrl({app_credentials, state});

  const query = querystring.stringify({state});
  const oauthUrl = `${process.env.requestOauthUrl}?${query}`;
  console.log("OAuth initiation query:", query);
  const oauthMessage = responses.requestOauthBlocks({oauthUrl});
  await messageSlack({response_url, data: oauthMessage});
  res.status(200).send("");
}

module.exports = {
  main
};
