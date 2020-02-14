const Slack = require("./slack");
const Spend = require("./spend");

// (pubSubEvent, context)
exports.main = async (pubSubEvent) => {
  const rawdata = pubSubEvent.data;
  if (!rawdata) {
    console.log("No data; abort!");
    return;
  }

  const data = JSON.parse(Buffer.from(pubSubEvent.data, "base64").toString());
  console.log("Got message:", data);

  const { expense, slackMessage } = data;
  const { response_url } = slackMessage;
  const { ok, error } = await Spend.handleSpend(
    { expense, slackMessage }
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
