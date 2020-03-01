const axios = require("axios");

const metadataServerTokenUrlBase = "http://metadata/computeMetadata/v1/instance/service-accounts/default/identity?audience=";

function getInvocationToken(functionUrl) {
  const metadataUrl = metadataServerTokenUrlBase + encodeURIComponent(functionUrl);
  console.log("Requesting metadata from " + metadataUrl);
  return axios({
    method: "GET",
    url: metadataUrl,
    headers: {
      "Metadata-Flavor": "Google"
    }
  }).then(response => response.data);
}

async function invokeFunction(url, data){
  const token = await getInvocationToken(url);
  console.log("Invocation token: " + token);
  const headers = {
    Authorization: `bearer ${token}`,
    "Content-type": "application/json",
  };

  console.log(`Invoking function at ${url} with data`, data);
  const response = await axios({
    method: "POST",
    url,
    headers,
    data,
  });
  console.log("Response: ", response.data);

  return response.data;
}

function reportError(error, response_url) {
  console.log("ERROOR:", error.message);
  return messageSlack({
    response_url,
    text: "Oh no! Something went wrong."
  }).then(response => {
    console.log("Error message response:", response.status);
  });
}

function messageSlack({ response_url, text, response_type = "ephemeral" }) {
  return axios({
    method: "POST",
    url: response_url,
    data: { response_type, text },
  });
}

function getTeamInfo(team_id) {
  console.log(`Getting team info for ${team_id}`);
  return invokeFunction(process.env.getTeamInfoUrl, {team_id});
}

async function router({ command, data }) {
  if (command === "budget") {
    const teamInfo = await getTeamInfo(data.team_id);
    return invokeFunction(process.env.getTotalsUrl, teamInfo);
  } else if (command === "spend") {
    const teamInfo = await getTeamInfo(data.team_id);
    const sendData = {...teamInfo, expense: data};
    return invokeFunction(process.env.addExpenseUrl, sendData);
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

  const { command, response_url, data } = message;
  await router(
    { command, data }
  ).then(response => {
    console.log("Response:", response);
  }).catch(err => {
    reportError(err, response_url);
  });
}

module.exports = { main };
