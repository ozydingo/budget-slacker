const { google } = require("googleapis");

const EXPENSE_RANGE = "expenses!A1:F1";
const HISTORY = 6;

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
  client.setCredentials(token);

  const sheets = google.sheets({version: "v4", auth: client});
  return sheets;
}

async function getTotals({sheets, spreadsheetId}) {
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `categories!B1:ZZ${HISTORY+1}`,
    majorDimension: "COLUMNS",
  });
  const totals = result.data.values.map(array => ({
    category: array[0],
    values: array.slice(1).map(Number)
  }));
}

async function addExpense({sheets, spreadsheetId, expense}) {
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
    spreadsheetId,
    range: EXPENSE_RANGE,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

async function main(req, res) {
  const { action, app_credentials, tokens, spreadsheet_id } = body;
  const sheets = sheetClient({app_credentials, tokens});
  if (action === "get_totals") {
    const totals = await getTotals({sheets, spreadsheet_id});
    res.status(200).send(JSON.stringify(totals));
  } else if (actiono === "add_expense") {
    const {expense} = body;
    await addExpense({sheets, spreadsheetId, expense});
    res.status(200).send({ok: true};
  } else {
    const msg = `Unknoown action ${action}`;
    console.error(msg);
    res.status(404).send(msg);
    return;
  }
}


module.exports = {
  main
};
