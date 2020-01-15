let spreadsheetId;
const secrets = require("./secrets");
const {Sheets} = require("sheets");
const sheets = new Sheets(secrets.app, secrets.oauth);

beforeAll(async () => {
  spreadsheetId = await sheets.setup();
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
});
