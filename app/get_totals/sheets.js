const { google } = require("googleapis");

const headers = [
  "timestamp",
  "user_id",
  "user_name",
  "amount",
  "category",
  "note",
];
const EXPENSE_RANGE = "expenses!A1:F1";
const MAX_CATEGORIES = 100;
const HISTORY = 6;


class Sheets {
  constructor(app_credentials, token_data) {
    this.app_credentials = app_credentials;
    this.token_data = token_data;
    const { client_id, client_secret } = app_credentials;
    console.log("Initializing OAuth2");
    this.client = new google.auth.OAuth2(
      client_id,
      client_secret,
    );
    console.log("Setting credentials");
    this.client.setCredentials(token_data);
    console.log("Initializing sheets client");
    this.sheets = google.sheets({version: "v4", auth: this.client});
    console.log("Done with sheets initialization");
  }

  async getTotals(spreadsheetId) {
    const result = await this.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `categories!B1:ZZ${HISTORY+1}`,
      majorDimension: "COLUMNS",
    });
    const totals = result.data.values.map(array => ({
      category: array[0],
      values: array.slice(1).map(Number)
    }));
    return totals;
  }
}

module.exports = {
  Sheets
};
