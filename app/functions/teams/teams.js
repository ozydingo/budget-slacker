const Firestore = require("@google-cloud/firestore");

const COLLECTION_NAME = "teams";
const PROJECT_ID = process.env.GCP_PROJECT;

const firestore = new Firestore({
  projectId: PROJECT_ID,
});
const collection = firestore.collection(COLLECTION_NAME);

async function find(team_id) {
  const result = await collection.where(
    "team_id", "==", String(team_id)
  ).limit(1).get();
  return result.docs[0];
}

async function find_or_create(team_id, attrs = {}) {
  const team = await find(team_id);
  if (team) { return team; }

  const ref = await collection.add({
    team_id: team_id,
    ...attrs,
  });
  const newUser = await ref.get();
  return newUser;
}

async function update(team_id, attrs) {
  const team = await(find_or_create(team_id));
  return collection.doc(team.id).update(attrs_for_update(attrs));
}

function attrs_for_update(attrs) {
  const return_attrs = {};
  if (attrs.tokens !== undefined) { return_attrs.tokens = attrs.tokens; }
  if (attrs.spreadsheet_id !== undefined) { return_attrs.spreadsheet_id = attrs.spreadsheet_id; }
  return return_attrs;
}

module.exports = {
  find,
  find_or_create,
  update,
};
