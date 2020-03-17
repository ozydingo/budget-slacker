const axios = require("axios");

const { getJsonSecret, getSecret } = require("./getSecret");
const { invokeFunction } = require("./invoke_function.js");
const responses = require("./responses.js");

// Do this on function initializaion; it doesn't change.
const credentialsPromise = getJsonSecret(process.env.appCredentialsSecret);
const slackTokenPromise = getSecret(process.env.slackTokenSecret);

function messageSlack({response_url, data}) {
  console.log("Responding to Slack");
  return axios({
    method: "POST",
    url: response_url,
    data,
  }).then(response => {
    console.log("Slack response:", response.status);
  });
}

function haveValidTokens(teamInfo) {
  return teamInfo && teamInfo.tokens;
}

function haveValidSpreadsheet(teamInfo) {
  return teamInfo && teamInfo.spreadsheet_id;
}

function getTeamInfo(team_id) {
  console.log(`Getting team info for ${team_id}`);
  return invokeFunction(process.env.teamsUrl, {action: "get", team_id});
}

function handleInvalidOauth({response_url, team_id}) {
  const oauthUrl = `${process.env.requestOauthUrl}?team_id=${encodeURIComponent(team_id)}`;
  const oauthMessage = responses.requestOauthBlocks({oauthUrl});
  return messageSlack({response_url, data: oauthMessage});
}

function handlleInvalidSpreadsheet({response_url}) {
  return messageSlack({response_url, data: responses.invalidSpreadsheetMessage});
}

async function handelBudget({response_url, teamInfo}) {
  const { spreadsheet_id, tokens } = teamInfo;
  const app_credentials = await credentialsPromise;
  const totals = await invokeFunction(
    process.env.getTotalsUrl,
    {app_credentials, spreadsheet_id, tokens}
  );
  const message = responses.reportTotals({totals});
  return messageSlack({response_url, data: message});
}

async function handleSpend({response_url, teamInfo, expense}) {
  const { spreadsheet_id, tokens } = teamInfo;
  const app_credentials = await credentialsPromise;
  const totals = await invokeFunction(
    process.env.getTotalsUrl,
    {app_credentials, spreadsheet_id, tokens}
  );
  const message = responses.confirmExpense({totals, expense});
  return Promise.all([
    invokeFunction(
      process.env.addExpenseUrl,
      {
        app_credentials,
        expense,
        spreadsheet_id,
        tokens,
      }
    ),
    messageSlack({response_url, data: message}),
  ]);
}

async function router({ command, data, response_url }) {
  const teamInfo = await getTeamInfo(data.team_id);

  if (!haveValidTokens(teamInfo)) {
    return handleInvalidOauth({response_url, team_id: data.team_id});
  } else if (!haveValidSpreadsheet) {
    return handlleInvalidSpreadsheet({response_url});
  }

  if (command === "report") {
    return handelBudget({response_url, teamInfo});
  } else if (command === "spend") {
    return handleSpend({response_url, teamInfo, expense: data});
  } else {
    return Promise.reject("Unrecognized command " + command);
  }
}

async function main(pubSubEvent) {
  const rawdata = pubSubEvent.data;
  if (!rawdata) {
    console.log("No data; abort!");
    return;
  }

  const message = JSON.parse(Buffer.from(pubSubEvent.data, "base64").toString());
  console.log("Got message:", message);
  const { token, command, data, response_url } = message;

  const appToken = await slackTokenPromise;
  if (token !== appToken) {
    console.log("Incorrect app token:", token);
    return;
  }
  console.log("Token is correct.");

  await router(
    { command, data, response_url }
  ).then(response => {
    console.log("Response:", response);
  }).catch(err => {
    console.error("ERROOR:", err.message);
    messageSlack({response_url, text: "Oh no! Something went wrong."});
  });
}

module.exports = { main };
