const headers = [
  "timestamp",
  "user_id",
  "user_name",
  "amount",
  "category",
  "note",
];

function epochToDatetime(timestamp) {
  const month = timestamp.getMonth() + 1;
  const date = timestamp.getDate();
  const year = timestamp.getYear();
  const hour = timestamp.getHours();
  const minute = timestamp.getMinutes();
  const second =  timestamp.getSeconds();
  return  `${month}/${date}/${year} ${hour}:${minute}:${second}`;
}

// Lazy-load the google api, otherwise the response to Slack times out.
let google;

class Sheets {
  constructor(app_credentials, token_data) {
    console.log("Initializing sheets wrapper");
    if (google === undefined) { ({google} = require("googleapis")); }
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

  async createSpreadsheet() {
    const resource = {
      properties: {
        title: "Budget Slacker",
      },
      sheets: [
        {
          properties: {
            title: "expenses"
          }
        },
        {
          properties: {
            title: "categories"
          }
        },
      ]
    };
    const fields = "spreadsheetId,sheets.properties.title,sheets.properties.sheetId";
    const spreadsheet = await this.sheets.spreadsheets.create({
      resource,
      fields,
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;
    const sheetIds = {};
    spreadsheet.data.sheets.forEach(sheet => {
      sheetIds[sheet.properties.title] = sheet.properties.sheetId;
    });
    console.log("Created sheets:", sheetIds);

    const setupResult = await this.setupSheet(spreadsheetId, sheetIds);
    console.log(setupResult);
    return spreadsheetId;
  }

  setupSheet(spreadsheetId, sheetIds) {
    const promises = [];
    promises.push(this.addRow(spreadsheetId, headers));

    const categoryHeaderValues = {
      range: "categories!B1",
      values: [
        ["=TRANSPOSE(UNIQUE(expenses!$E$2:$E))"]
      ]
    };
    const thisMonthValues = {
      range: "categories!A2",
      values: [
        ["=EOMONTH(TODAY(),-1)+1"]
      ]
    };

    promises.push(this.sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      resource: {
        valueInputOption: "USER_ENTERED",
        data: [
          categoryHeaderValues,
          thisMonthValues
        ]
      }
    }));

    const prevMonthsValues = {
      repeatCell: {
        range: {
          sheetId: sheetIds.categories,
          startRowIndex: 2,
          endRowIndex: 7,
          startColumnIndex: 0,
          endColumnIndex: 1,
        },
        cell: {
          userEnteredValue: {
            formulaValue: "=EOMONTH(A2-7,-1)+1",
          },
        },
        fields: "userEnteredValue",
      }
    };
    const subtotalValues = {
      repeatCell: {
        range: {
          sheetId: sheetIds.categories,
          startRowIndex: 1,
          endRowIndex: 7,
          startColumnIndex: 1,
          endColumnIndex: 100,
        },
        cell: {
          userEnteredValue: {
            formulaValue: "=if(B$1=\"\",\"\",sum(filter(expenses!$D$2:$D,expenses!$E$2:$E=B$1,month(expenses!$A$2:$A)=month($A2), year(expenses!$A$2:$A)=year($A2))))",
          },
        },
        fields: "userEnteredValue",
      }
    };

    promises.push(this.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [
          prevMonthsValues,
          subtotalValues
        ]
      },
    }));
    return Promise.all(promises);
  }

  async addSpend(spreadsheetId, data) {
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

    console.log("Appending row with", values);
    const response = await this.addRow(spreadsheetId, values);
    const range = response.data.updates.updatedRange;

    console.log("Reading values for formula evaluation");
    const result = await this.sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const total = result.data.values[0][6];
    console.log("Got total:", total);

    return total;
  }

  addRow(spreadsheetId, values) {
    return this.sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "expenses!A1:F1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] },
    });
  }
}

module.exports = {
  Sheets
};
