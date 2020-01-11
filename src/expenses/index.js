const Spend = require("./spend");

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

  let ok;
  let message;

  if (command === "/spend") {
    ({ ok, message } = await Spend.handleSpend(body));
  } else {
    ({ ok, message} = {ok: false, message: `Command ${command} not recognized` });
  }

  const status = ok ? 200 : 400;
  res.status(status).send(message);
};
