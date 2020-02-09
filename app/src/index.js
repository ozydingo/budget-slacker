function verifyToken(token) {
  return token === process.env.app_token;
}

// Main event function handler
exports.main = async (req, res) => {
  const { body, query } = req;
  console.log("Body", body);
  console.log("Query", query);

  const { command, token } = body;
  if (!verifyToken(token)) {
    console.log("Unrecognized app token:", token);
    res.status(417).send("Who are you?");
    return;
  }
  res.status(200).write("Got it!");

  let ok;
  let message;

  if (command === "/spend") {
    const Spend = require("./spend");
    ({ ok, message } = await Spend.handleSpend(body));
  } else {
    ({ ok, message} = {ok: false, message: `Command ${command} not recognized` });
  }
  console.log({ ok, message });
  res.end();
};
