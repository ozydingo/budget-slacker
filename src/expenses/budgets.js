const Firestore = require("@google-cloud/firestore");
const PROJECTID = "budget-slacker";
const COLLECTION_NAME = "budgets";
const firestore = new Firestore({
  projectId: PROJECTID,
});
const collection = firestore.collection(COLLECTION_NAME);

async function find(team_id) {
  const result = await collection.where(
    "team_id", "==", String(team_id)
  ).limit(1).get();
  return result.docs[0];
}

module.exports = {
  find
};
