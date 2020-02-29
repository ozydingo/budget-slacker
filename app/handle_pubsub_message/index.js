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

  const response = await axios({
    method: "POST",
    url,
    headers,
    data,
  });
  console.log(response.data);

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

function router({ command, data }) {
  if (command === "budget") {
    invokeFunction(process.env.getTotalsUrl, data);
  } else if (command === "spend") {
    invokeFunction(process.env.addExpenseUrl, data);
  } else {
    throw new Error("Unrecognized command " + command);
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
    console.log("Response: " + response.data);
  }).catch(err => {
    reportError(err, response_url);
  });
}

module.exports = { main };
