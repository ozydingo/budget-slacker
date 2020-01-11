const Budget = require("./budgets");
const { Sheets } = require("./sheets");

const SPEND_PATTERN = /\$?(\d+(?:\.\d{1,2})?)\s+(?:on\s+)?(.+?)(?:\s*:\s*(.*))?$/;
const { client_id, client_secret } = process.env;
const app_credentials = { client_id, client_secret };
// TODO: store access and refresh tokens in db instead of env

async function handleSpend(body) {
  const { team_id, text, user_name, user_id } = body;
  const timestamp = (new Date()).getTime();
  const { ok, spendData } = parseSpend(text);
  if (!ok) { return { ok: false, message: "Invalid command format. Use \"$AMOUNT on CATEGORY: NOTE\"" }; }
  console.log("Spend data:", spendData);

  const budget = await Budget.find(team_id);
  if (!budget) { return { ok: false, message: "Unfortunately, I can't find this workspace's buduget." }; }
  console.log("Budget:", budget);

  const { access_token, refresh_token, spreadsheet_id } = budget.data();
  if (!access_token) { return { ok: false, message: "access_token is missing from this workspace!" }; }
  if (!refresh_token) { return { ok: false, message: "refresh_token is missing from this workspace!" }; }
  if (!spreadsheet_id) { return { ok: false, message: "spreadsheet_id is missing from this workspace!" }; }
  console.log("Spreadsheet:", spreadsheet_id);

  const { amount, category, note } = spendData;
  const conf = `Amount: ${amount}\nCategory: ${category}\nNote: ${note}`;

  const token_credentials = { access_token, refresh_token };
  const sheets = new Sheets(app_credentials, token_credentials);

  const appendResult = await sheets.addSpend(
    spreadsheet_id,
    { timestamp, user_id, user_name, amount,  category, note }
  );
  console.log("Result of row append:", appendResult);

  return {ok: true, message: conf};
}

function parseSpend(text) {
  const match = text.match(SPEND_PATTERN);
  if (!match) { return {ok: false}; }
  const [, amount, category, note] = match;
  return {ok: true, spendData: {amount, category, note}};
}

module.exports = {
  handleSpend,
};
