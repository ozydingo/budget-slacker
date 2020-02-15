const Slack = require("./slack");
const Spend = require("./spend");

function reportError(error, response_url) {
  console.log(error.message);
  Slack.respond({
    response_url,
    text: "Oh no! Something went wrong."
  }).then(response => {
    console.log("Error message response:", response.status);
  });
}

function router({ command, response_url, data }) {
  if (command === "spend") {
    return Spend.handleSpend(
      { response_url, data }
    );
  } else if (command === "budget") {
    return Spend.report(
      { response_url, data }
    );
  }
}

// (pubSubEvent, context)
exports.main = async (pubSubEvent) => {
  const rawdata = pubSubEvent.data;
  if (!rawdata) {
    console.log("No data; abort!");
    return;
  }

  const message = JSON.parse(Buffer.from(pubSubEvent.data, "base64").toString());
  console.log("Got message:", message);

  const { command, response_url, data } = message;
  await router(
    { command, response_url, data }
  ).catch(err => {
    reportError(err, response_url);
  });
};
