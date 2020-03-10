const axios = require("axios");

const { invokeFunction } = require("./invoke_function.js");
const responses = require("./responses.js");

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

function getTeamInfo(team_id) {
  console.log(`Getting team info for ${team_id}`);
  return invokeFunction(process.env.teamsUrl, {action: "get", team_id});
}

async function router({ command, data, response_url }) {
  const teamInfo = await getTeamInfo(data.team_id);

  if (!teamInfo || data.team_id === "TEST-OAUTH") {
    const oauthUrl = `${process.env.requestOauthUrl}?team_id=${encodeURIComponent(data.team_id)}`;
    const oauthMessage = responses.requestOauthBlocks({oauthUrl});
    return messageSlack({response_url, data: oauthMessage});
  }

  if (command === "budget") {
    const totals = await invokeFunction(process.env.getTotalsUrl, teamInfo);
    const message = responses.reportTotals({totals});
    return messageSlack({response_url, data: message});
  } else if (command === "spend") {
    const totals = await invokeFunction(process.env.getTotalsUrl, teamInfo);
    const sendData = {...teamInfo, expense: data};
    const message = responses.confirmExpense({totals, expense: data});
    return Promise.all([
      invokeFunction(process.env.addExpenseUrl, sendData),
      messageSlack({response_url, data: message}),
    ]);
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

  const { command, data, response_url } = message;
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
