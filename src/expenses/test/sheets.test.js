test("it creates a spreadsheet", async () => {
  const secrets = require("./secrets");
  const {Sheets} = require("sheets");
  const sheets = new Sheets(secrets.app, secrets.oauth);
  const spreadsheetId = await sheets.setup();
  await sheets.addExpense(spreadsheetId, {
    timestamp: new Date(),
    amount: 12,
    category: "dining"
  });
});
