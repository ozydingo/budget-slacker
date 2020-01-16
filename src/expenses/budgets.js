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

async function find_or_create(team_id) {
  const budget = await find(team_id);
  if (budget) { return budget; }

  const ref = await collection.add({
    team_id: team_id,
  });
  const newBudget = await ref.get();
  return newBudget;
}

async function update(team_id, {spreadsheet_id}) {
  const budget = await find_or_create(team_id);

  return collection.doc(budget.id).update({
    spreadsheet_id,
  });
}

module.exports = {
  find,
  find_or_create,
  update,
};
