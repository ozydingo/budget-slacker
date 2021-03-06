const { sheetsClient } = require("./sheets_client");

const HISTORY = 6;

function parseDollars(value) {
  if (!value) { return 0; }
  return Number(value.replace("$", ""));
}

async function getTotals({sheets, spreadsheet_id}) {
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheet_id,
    range: `Categories!B1:ZZ${HISTORY+1}`,
    majorDimension: "COLUMNS",
  });
  if (!result.data.values) { return []; }
  const totals = result.data.values.map(array => ({
    category: array[0],
    values: array.slice(1).map(value => parseDollars(value)),
  }));
  return totals;
}

async function main(req, res) {
  const { app_credentials, tokens, spreadsheet_id } = req.body;
  const sheets = sheetsClient({app_credentials, tokens});
  const totals = await getTotals({sheets, spreadsheet_id});
  res.status(200).send(JSON.stringify(totals));
}


module.exports = {
  main
};
