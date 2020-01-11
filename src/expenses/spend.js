const Budget = require("./budgets");
const { Sheets } = require("./sheets");
const Slack = require("./slack");

const SPEND_PATTERN = /\$?(\d+(?:\.\d{1,2})?)\s+(?:on\s+)?(.+?)(?:\s*:\s*(.*))$/;
const { client_id, client_secret } = process.env;
const app_credentials = { client_id, client_secret };

async function handleSpend(body) {
  const promises = [];
  const { response_url, team_id, text, user_name, user_id } = body;
  const timestamp = new Date();
  const { ok, spendData } = parseSpend(text);
  if (!ok) {
    await Promise.all(promises);
    return { ok: false, message: "Invalid command format. Use \"$AMOUNT on CATEGORY: NOTE\"" };
  }
  console.log("Spend data:", spendData);
  const { amount, category, note } = spendData;
  const confirmationMessage = `Got it! You spent ${amount} on the category ${category}, with a note: ${note}`;
  // TODO: don't await but make sure to await before any return
  const confirmation = Slack.respond({ response_url, text: confirmationMessage }).then(response => {
    console.log("Confirmation response:", response);
  });
  promises.push(confirmation);

  const budget = await Budget.find(team_id);
  if (!budget) {
    await Promise.all(promises);
    return { ok: false, message: "Unfortunately, I can't find this workspace's buduget." };
  }
  console.log("Budget:", budget);

  const { access_token, refresh_token, spreadsheet_id } = budget.data();
  if (!access_token) {
    await Promise.all(promises);
    return { ok: false, message: "access_token is missing from this workspace!" };
  }
  if (!refresh_token) {
    await Promise.all(promises);
    return { ok: false, message: "refresh_token is missing from this workspace!" };
  }
  if (!spreadsheet_id) {
    await Promise.all(promises);
    return { ok: false, message: "spreadsheet_id is missing from this workspace!" };
  }
  console.log("Spreadsheet:", spreadsheet_id);

  const token_credentials = { access_token, refresh_token };
  const sheets = new Sheets(app_credentials, token_credentials);

  const appendResult = await sheets.addSpend(
    spreadsheet_id,
    { timestamp, user_id, user_name, amount, category, note }
  );
  console.log("Result of row append:", appendResult);

  await Promise.all(promises);
  return {ok: true, message: confirmationMessage};
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
