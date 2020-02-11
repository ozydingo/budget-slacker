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
  const { ok, error } = await Spend.handleSpend({ expense, slackMessage });
  console.log({ ok, error });
};
