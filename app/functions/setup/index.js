const { invokeFunction } = require("./invoke_function");

async function main(req, res) {
  const { app_credentials, team_id, tokens } = req.body;
  const { spreadsheet_id } = await invokeFunction(
    process.env.spreadsheetsUrl, {
      action: "create",
      app_credentials,
      tokens
    },
  );
  await invokeFunction(
    process.env.teamsUrl, {
      action: "update",
      team_id,
      spreadsheet_id,
    }
  );
  res.status(200).json({team_id, spreadsheet_id});
}

module.exports = {
  main,
};
