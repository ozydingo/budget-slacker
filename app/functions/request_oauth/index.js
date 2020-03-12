const { google } = require("googleapis");

const { getSecret } = require("./getSecret");

const SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.file"
];
const oauthRedirectUri = process.env.storeOauthUrl;

// Do this on function initializaion; it doesn't change.
const credentialsPromise = getSecret(process.env.appCredentialsSecret);

function getAuthUrl({app_credentials, team_id}) {
  const {client_secret, client_id} = app_credentials;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, oauthRedirectUri
  );

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state: JSON.stringify({team_id}),
  });

  return authUrl;
}

function htmlRedirect(url) {
  return `<html><head><script>window.location.href="${url}";</script></head></html>`;
}

async function main(req, res) {
  console.log("Method:", req.method);
  console.log("Body:", req.body);
  console.log("Query:", req.query);

  const { query: { team_id } } = req;
  const app_credentials = await credentialsPromise;
  const oauthUrl = getAuthUrl({app_credentials, team_id});
  res.status(200).send(htmlRedirect(oauthUrl));
}

module.exports = {
  main,
};
