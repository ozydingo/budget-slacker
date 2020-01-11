const { Sheets } = require("./sheets");

const SPEND_PATTERN = /\$?(\d+(?:\.\d{1,2})?)\s+(?:on\s+)?(.+?)(?:\s*:\s*(.*))?$/;
const { client_id, client_secret, access_token, refresh_token } = process.env;
const app_credentials = { client_id, client_secret };
// TODO: store access and refresh tokens in db instead of env
const token_credentials = { access_token, refresh_token };

async function handleSpend(body, spreadsheetId) {
  const { text, user_name, user_id } = body;
  const timestamp = (new Date()).getTime();
  const { ok, data } = parseSpend(text);
  if (!ok) { return { ok: false, message: "Invalid command format." }; }

  const { amount, category, note } = data;
  const conf = `Amount: ${amount}\nCategory: ${category}\nNote: ${note}`;
  console.log(conf);

  const sheets = new Sheets(app_credentials, token_credentials);

  const appendResult = await sheets.addSpend(
    spreadsheetId,
    { timestamp, user_id, user_name, amount,  category, note }
  );
  console.log(appendResult);

  return {ok: true, message: conf};
}

function parseSpend(text) {
  const match = text.match(SPEND_PATTERN);
  if (!match) { return {ok: false}; }
  const [, amount, category, note] = match;
  return {ok: true, data: {amount, category, note}};
}

module.exports = {
  handleSpend,
};
