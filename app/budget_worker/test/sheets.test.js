const secrets = require("./secrets");

const Budget = require("budgets");
const {Sheets} = require("sheets");
const sheets = new Sheets(secrets.app, secrets.oauth);

const team_id = "test";

jest.setTimeout(10000);

let spreadsheetId;

describe("sheets", () => {
  beforeAll(async () => {
    spreadsheetId = await sheets.setup(team_id);
    console.log("Testing with spreadsheet", spreadsheetId);
  });

  test("it creates a spreadsheet", async () => {
    await sheets.addExpense(spreadsheetId, {
      timestamp: new Date(),
      amount: 12,
      category: "dining"
    });
    await sheets.addExpense(spreadsheetId, {
      timestamp: new Date(),
      amount: 10,
      category: "dining"
    });
    await sheets.addExpense(spreadsheetId, {
      timestamp: new Date((new Date() - 1000 * 60 * 60 * 24 * 50)),
      amount: 17,
      category: "clothes"
    });
    const totals = await sheets.getTotals(spreadsheetId);
    expect(totals["dining"][0]).toBe(22);
    expect(totals["clothes"][2]).toBe(17);

    const budget = await Budget.find(team_id);
    expect(budget.data().spreadsheet_id).toBe(spreadsheetId);
  });
})
