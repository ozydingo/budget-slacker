const Budget = require("./budgets");

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

function epochToDatetime(timestamp) {
  const month = timestamp.getMonth() + 1;
  const date = timestamp.getDate();
  const year = timestamp.getFullYear();
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

  async setup(teamId) {
    try {
      console.log("Team", teamId);
      const spreadsheet = await this.createSpreadsheet();
      const spreadsheetId = spreadsheet.data.spreadsheetId;
      console.log("Created spreadsheet with id", spreadsheetId);
      const updateBudgetPromise = Budget.update(teamId, {spreadsheet_id: spreadsheetId});
      const sheetIds = this.getSheetIds(spreadsheet);
      console.log("Sheets:", sheetIds);
      const setupResult = await this.setupSheetValues(spreadsheetId, sheetIds);
      console.log("Setup results:", setupResult);

      await updateBudgetPromise;
      return spreadsheetId;
    } catch(err) {
      console.error("Error:", err);
    }
  }

  createSpreadsheet() {
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
    return this.sheets.spreadsheets.create({
      resource,
      fields,
    });
  }

  getSheetIds(spreadsheet) {
    const sheetIds = {};
    spreadsheet.data.sheets.forEach(sheet => {
      sheetIds[sheet.properties.title] = sheet.properties.sheetId;
    });
    return sheetIds;
  }

  setupSheetValues(spreadsheetId, sheetIds) {
    const expenseHeadersRequest = {
      spreadsheetId,
      range: EXPENSE_RANGE,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [headers] },
    };

    const categoryHeaderValues = {
      range: "categories!B1",
      values: [
        ["=TRANSPOSE(UNIQUE(ARRAYFORMULA(LOWER(expenses!$E$2:$E))))"]
      ]
    };
    const thisMonthValues = {
      range: "categories!A2",
      values: [
        ["=EOMONTH(TODAY(),-1)+1"]
      ]
    };

    const categoriesSeedRequest = {
      spreadsheetId,
      resource: {
        valueInputOption: "USER_ENTERED",
        data: [
          categoryHeaderValues,
          thisMonthValues
        ]
      }
    };

    const prevMonthsValues = {
      repeatCell: {
        range: {
          sheetId: sheetIds.categories,
          startRowIndex: 2,
          endRowIndex: HISTORY + 1,
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
          endRowIndex: HISTORY + 1,
          startColumnIndex: 1,
          endColumnIndex: MAX_CATEGORIES,
        },
        cell: {
          userEnteredValue: {
            formulaValue: "=if(B$1=\"\",\"\",ifna(sum(filter(expenses!$D$2:$D,expenses!$E$2:$E=B$1,month(expenses!$A$2:$A)=month($A2), year(expenses!$A$2:$A)=year($A2))),0))",
          },
        },
        fields: "userEnteredValue",
      }
    };
    const categoriesFillRequest = {
      spreadsheetId,
      resource: {
        requests: [
          prevMonthsValues,
          subtotalValues
        ]
      },
    };

    return Promise.all([
      this.sheets.spreadsheets.values.append(expenseHeadersRequest).then(res => res.data.updates),
      this.sheets.spreadsheets.values.batchUpdate(categoriesSeedRequest).then(res => res.data.responses),
      this.sheets.spreadsheets.batchUpdate(categoriesFillRequest).then(res => res.data.replies ),
    ]);
  }

  addExpense(spreadsheetId, data) {
    const values = [
      epochToDatetime(data.timestamp),
      data.user_id,
      data.user_name,
      data.amount,
      data.category,
      data.note,
    ];

    console.log("Appending row with", values);
    return this.sheets.spreadsheets.values.append({
      spreadsheetId,
      range: EXPENSE_RANGE,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] },
    });
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