const Firestore = require("@google-cloud/firestore");
const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");

const COLLECTION_NAME = "budgets";
const CREDENTIALS_SECRET = "projects/526411321629/secrets/sheets-api-credentials/versions/1";
const PROJECTID = "budget-slacker";

const firestore = new Firestore({
  projectId: PROJECTID,
});
const collection = firestore.collection(COLLECTION_NAME);

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

async function main(team_id) {
  console.log("Fetching budget info");
  const budget = await Budget.find(team_id);
  if (!budget) { throw Error(`Budget not found for team ${team_id}!`); }

  const { access_token, refresh_token, spreadsheet_id } = budget.data();
  if (!access_token) { throw Error(`access_token is missing for team ${team_id}!`); }
  if (!refresh_token) { throw Error(`refresh_token is missing for team ${team_id}!`); }
  if (!spreadsheet_id) { throw Error(`spreadsheet_id is missing for team ${team_id}!`); }
  console.log("Spreadsheet:", spreadsheet_id);
  const token_credentials = { access_token, refresh_token };
  const app_credentials = await credentialsPromise;

  return { spreadsheet_id, app_credentials, token_credentials };
}

module.exports = {
  main
};
