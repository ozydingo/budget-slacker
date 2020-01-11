const {google} = require("googleapis");

const headers = [
  "timestamp",
  "user_id",
  "user_name",
  "amount",
  "category",
  "note"
];

function epochToDatetime(timestamp) {
  const month = timestamp.getMonth() + 1;
  const date = timestamp.getDate();
  const year = timestamp.getYear();
  const hour = timestamp.getHouurs();
  const minute = timestamp.getMinutes();
  const second =  timestamp.getSeconds();
  return  `${month}/${date}/${year} ${hour}:${minute}:${second}`;
}

class Sheets {
  constructor(app_credentials, token_data) {
    this.app_credentials = app_credentials;
    this.token_data = token_data;
    const { client_id, client_secret } = app_credentials;
    this.client = new google.auth.OAuth2(
      client_id,
      client_secret,
    );
    this.client.setCredentials(token_data);
    this.sheets = google.sheets({version: "v4", auth: this.client});
  }

  async createSpreadsheet() {
    const sheets = google.sheets({version: "v4", auth: this.client});
    const resource = {
      properties: {
        title: "Budget Slacker",
      },
    };
    const spreadsheet = await sheets.spreadsheets.create({
      resource,
      fields: "spreadsheetId",
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;

    const result = await this.addRow(spreadsheetId, headers);
    console.log("createSpreadsheet result:", result);
    return spreadsheetId;
  }

  addSpend(spreadsheetId, data) {
    const {
      timestamp,
      user_id,
      user_name,
      amount,
      category,
      note
    } = data;

    const datetime = epochToDatetime(timestamp);

    const values = [
      datetime,
      user_id,
      user_name,
      amount,
      category,
      note,
    ];

    return this.addRow(spreadsheetId, values);
  }

  addRow(spreadsheetId, values) {
    return this.sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A1:F1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] },
    });
  }
}

module.exports = {
  Sheets
};
