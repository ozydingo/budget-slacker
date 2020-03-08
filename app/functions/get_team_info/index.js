const Firestore = require("@google-cloud/firestore");

const { getSecret } = require("./getSecret");

const COLLECTION_NAME = "budgets";
const PROJECTID = process.env.GCP_PROJECT;

const firestore = new Firestore({
  projectId: PROJECTID,
});
const collection = firestore.collection(COLLECTION_NAME);

// Do this on function initializaion; it doesn't change.
const credentialsPromise = getSecret(process.env.appCredentialsSecret);

async function findTeamRecord(team_id) {
  const result = await collection.where(
    "team_id", "==", String(team_id)
  ).limit(1).get();
  return result.docs[0];
}

async function main(req, res) {
  const {team_id} = req.body;
  console.log("Fetching budget info");
  const budget = await findTeamRecord(team_id);
  if (!budget) {
    res.status(200).send("null");
    return;
  }

  const { access_token, refresh_token, spreadsheet_id } = budget.data();
  if (!access_token) { throw Error(`access_token is missing for team ${team_id}!`); }
  if (!refresh_token) { throw Error(`refresh_token is missing for team ${team_id}!`); }
  if (!spreadsheet_id) { throw Error(`spreadsheet_id is missing for team ${team_id}!`); }
  console.log("Spreadsheet:", spreadsheet_id);
  const tokens = { access_token, refresh_token };
  const app_credentials = await credentialsPromise;
  const data = { spreadsheet_id, app_credentials, tokens };

  res.status(200).send(JSON.stringify(data));
}

module.exports = {
  main
};
