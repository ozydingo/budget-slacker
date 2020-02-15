const Budget = require("./budgets");
const { Sheets } = require("./sheets");
const Slack = require("./slack");
const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");

const secretsClient = new SecretManagerServiceClient();
function accessSecret(versionString) {
  return secretsClient.accessSecretVersion({
    name: versionString
  }).then(response => {
    return response[0].payload.data.toString("utf8");
  });
}
const app_credentials_promise = accessSecret(
  "projects/526411321629/secrets/sheets-api-credentials/versions/1"
).then(JSON.parse);

async function getBudgetInfo(team_id) {
  console.log("Fetching budget info");
  const budget = await Budget.find(team_id);
  if (!budget) { throw Error(`Budget not found for team ${team_id}!`); }

  const { access_token, refresh_token, spreadsheet_id } = budget.data();
  if (!access_token) { throw Error(`access_token is missing for team ${team_id}!`); }
  if (!refresh_token) { throw Error(`refresh_token is missing for team ${team_id}!`); }
  if (!spreadsheet_id) { throw Error(`spreadsheet_id is missing for team ${team_id}!`); }
  console.log("Spreadsheet:", spreadsheet_id);
  const token_credentials = { access_token, refresh_token };
  const app_credentials = await app_credentials_promise;

  return { spreadsheet_id, app_credentials, token_credentials };
}

async function handleSpend({ response_url, data }) {
  const { team_id } = data;
  const timestamp = new Date();

  const { spreadsheet_id, app_credentials, token_credentials } = await getBudgetInfo(team_id);
  const sheets = new Sheets(app_credentials, token_credentials);

  const { user_name, user_id, amount, category, note } = data;

  // Prioritize fast response: get totals and send confirmation first
  // Use await to avoid race between getTotals and addExpense
  const totals = await sheets.getTotals(spreadsheet_id);
  const totalForCategory = totals.find(item => item.category === category);
  const previousTotal = totalForCategory && Number(totalForCategory.values[0]) || 0;
  const total = previousTotal + Number(amount);
  const resultMessage = `You've spent $${total} so far this month on ${category}`;

  const promises = [];
  promises.push(
    Slack.respond({ response_url, text: resultMessage }).then(response => {
      console.log("Result response:", response.status);
    })
  );
  promises.push(
    sheets.addExpense(
      spreadsheet_id,
      { timestamp, user_id, user_name, amount, category, note }
    )
  );

  await Promise.all(promises);
  return {ok: true};
}

module.exports = {
  handleSpend,
};
