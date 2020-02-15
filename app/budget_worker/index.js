const Slack = require("./slack");
const Spend = require("./spend");

// (pubSubEvent, context)
exports.main = async (pubSubEvent) => {
  const rawdata = pubSubEvent.data;
  if (!rawdata) {
    console.log("No data; abort!");
    return;
  }

  const message = JSON.parse(Buffer.from(pubSubEvent.data, "base64").toString());
  console.log("Got message:", message);

  const { response_url, data } = message;
  const { ok, error } = await Spend.handleSpend(
    { response_url, data }
  ).catch(err => {
    Slack.respond({
      response_url,
      text: "Oh no! Something went wrong when adding this expense to the spreadsheet."
    }).then(response => {
      console.log("Error message response:", response.status);
    });
    return {ok: false, error: err.message};
  });
  console.log({ ok, error });
};
