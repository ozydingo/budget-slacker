test("it creates a spreadsheet", async () => {
  const secrets = require("./secrets");
  const {Sheets} = require("sheets");
  const sheets = new Sheets(secrets.app, secrets.oauth);
  await sheets.setup().then(console.log);  
});
