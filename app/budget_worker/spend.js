const Budget = require("./budgets");
const { Sheets } = require("./sheets");
const Slack = require("./slack");

const SPEND_PATTERN = /\$?(\d+(?:\.\d{1,2})?)\s+(?:on\s+)?(.+?)(?:\s*:\s*(.*))$/;
const { client_id, client_secret } = process.env;
const app_credentials = { client_id, client_secret };

async function bail(promises, message) {
  console.log("Bailing out with message:", message);
  await Promise.all(promises);
  return {
    ok: false,
    error: message
  };
}

async function handleSpend({ expense, slackMessage }) {
  const promises = [];
  const { response_url, team_id, text, user_name, user_id } = slackMessage;
  const timestamp = new Date();

  console.log("Fetching budget info");
  const budget = await Budget.find(team_id);
  if (!budget) { return bail(promises, "Unfortunately, I can't find this workspace's buduget."); }
  console.log("Budget:", budget.data());

  const { access_token, refresh_token, spreadsheet_id } = budget.data();
  if (!access_token) { return bail(promises, "access_token is missing from this workspace!"); }
  if (!refresh_token) { return bail(promises, "refresh_token is missing from this workspace!"); }
  if (!spreadsheet_id) { return bail(promises, "spreadsheet_id is missing from this workspace!"); }
  console.log("Spreadsheet:", spreadsheet_id);

  const token_credentials = { access_token, refresh_token };
  const sheets = new Sheets(app_credentials, token_credentials);

  const { amount, category, note } = expense;

  // Do this first to be sure we aren't waiting for the formula result to update
  const totals = await sheets.getTotals(spreadsheet_id);
  const total = Number(totals[category][0]) + Number(amount);
  const resultMessage = `You've spent $${total} so far this month on ${category}`;
  promises.push(Slack.respond({ response_url, text: resultMessage }).then(response => {
    console.log("Result response:", response.status);
  }));

  promise.push(sheets.addExpense(
    spreadsheet_id,
    { timestamp, user_id, user_name, amount, category, note }
  ));

  await Promise.all(promises);
  return {ok: true};
}

module.exports = {
  handleSpend,
};