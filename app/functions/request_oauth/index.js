const { google } = require("googleapis");
const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");

const CREDENTIALS_SECRET = "projects/526411321629/secrets/sheets-api-credentials/versions/1";
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];
const oauthRedirectUri = process.env.storeOauthUrl;

const { requestOauthBlocks } = require("./responses");

async function getAppCredentials(versionString = CREDENTIALS_SECRET) {
  const secretsClient = new SecretManagerServiceClient();
  const secretData = await secretsClient.accessSecretVersion({
    name: versionString
  });
  const secret = secretData[0].payload.data.toString("utf8");
  const credentials = JSON.parse(secret);
  return credentials;
}

// Do this on function initializaion; it doesn't change.
const credentialsPromise = getAppCredentials();

function getAuthUrl({app_credentials, team_id}) {
  const {client_secret, client_id} = app_credentials;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, oauthRedirectUri
  );

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state: JSON.stringify({team_id}),
  });

  return authUrl;
}

async function main(req, res) {
  const { body: { team_id } } = req;
  const app_credentials = await credentialsPromise;
  const oauthUrl = getAuthUrl({app_credentials, team_id});
  res.status(200).send(requestOauthBlocks({oauthUrl}));
}

module.exports = {
  main,
};
