const { google } = require("googleapis");

const EXPENSE_RANGE = "expenses!A1:F1";

function epochToDatetime(timestamp) {
  const month = timestamp.getMonth() + 1;
  const date = timestamp.getDate();
  const year = timestamp.getFullYear();
  const hour = timestamp.getHours();
  const minute = timestamp.getMinutes();
  const second =  timestamp.getSeconds();
  return  `${month}/${date}/${year} ${hour}:${minute}:${second}`;
}

function sheetClient({app_credentials, tokens}) {
  const { client_id, client_secret } = app_credentials;

  const client = new google.auth.OAuth2(
    client_id,
    client_secret,
  );
  client.setCredentials(tokens);

  const sheets = google.sheets({version: "v4", auth: client});
  return sheets;
}

async function addExpense({sheets, spreadsheet_id, expense}) {
  const values = [
    epochToDatetime(expense.timestamp),
    expense.user_id,
    expense.user_name,
    expense.amount,
    expense.category,
    expense.note,
  ];

  console.log("Appending row with", values);
  return sheets.spreadsheets.values.append({
    spreadsheet_id,
    range: EXPENSE_RANGE,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

async function main(req, res) {
  const { app_credentials, tokens, spreadsheet_id, expense } = req.body;
  const sheets = sheetClient({app_credentials, tokens});
  await addExpense({sheets, spreadsheet_id, expense});
  res.status(200).send({ok: true});
}

module.exports = {
  main
};