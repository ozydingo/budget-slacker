const { invokeFunction } = require("./invoke_function");

function getTeam(team_id) {
  return invokeFunction(
    process.env.teamsUrl, {
      action: "get",
      team_id,
    }
  );
}

function createSpreadsheet({ app_credentials, tokens }) {
  return invokeFunction(
    process.env.spreadsheetsUrl, {
      action: "create",
      app_credentials,
      tokens
    },
  ).then(({ spreadsheet_id }) => spreadsheet_id);
}

async function main(req, res) {
  const { app_credentials, team_id, tokens } = req.body;
  const team = await getTeam(team_id);
  console.log("Current team info:", team);

  let spreadsheet_id;
  if (team.spreadsheet_id) {
    spreadsheet_id = team.spreadsheet_id;
  } else {
    spreadsheet_id = await createSpreadsheet({app_credentials, tokens});
    console.log("Created spreadsheet", spreadsheet_id);
    await invokeFunction(
      process.env.teamsUrl, {
        action: "update",
        team_id,
        spreadsheet_id,
      }
    );
  }

  res.status(200).json({team_id, spreadsheet_id});
}

module.exports = {
  main,
};
