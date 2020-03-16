const sheetsClient = require("./sheets_client");

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

function dataRow(expense) {
  const time = new Date(expense.timestamp);
  const values = [
    epochToDatetime(time),
    expense.user_id,
    expense.user_name,
    expense.amount,
    expense.category,
    expense.note,
  ];
  return values;
}

async function addExpense({sheets, spreadsheet_id, expense}) {
  const values = dataRow(expense);
  console.log("Appending row with", values);
  return sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheet_id,
    range: EXPENSE_RANGE,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

async function main(req, res) {
  const { app_credentials, tokens, spreadsheet_id, expense } = req.body;
  const sheets = sheetsClient({app_credentials, tokens});
  await addExpense({sheets, spreadsheet_id, expense});
  res.status(200).send({ok: true});
}

module.exports = {
  main
};
