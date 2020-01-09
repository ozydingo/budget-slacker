const {google} = require('googleapis');

function client(token) {
  const client = new google.auth.OAuth2();
  client.setCredentials(token);
  return client;
}

function sheets(token) {
  return google.sheets({version: 'v4', client: client(token)})
}

async function addSpend(
  spreadsheetId,
  {
    timestamp,
    user_id,
    user_name,
    amount,
    category,
    note
  }) {

  const result = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Sheet1!A1:F1",
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [timestamp, user_id, user_name, amount, category, note]
    },
  });
}
