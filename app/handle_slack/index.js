const SPEND_PATTERN = /\$?(\d+(?:\.\d{1,2})?)\s+(?:on\s+)?(.+?)(?:\s*:\s*(.*))$/;
const APP_TOKEN = process.env.app_token;

function verifyToken(token) {
  return token === APP_TOKEN;
}

function parseSpend(text) {
  const match = text.match(SPEND_PATTERN);
  if (!match) { return {ok: false}; }
  const [, amount, category, note] = match;
  return {ok: true, spendData: {amount, category, note}};
}

function spendMessage({ ok, spendData }) {
  if (ok) {
    return `$${spendData.amount} on ${spendData}, got it!`;
  } else {
    return "Invalid command format. Use \"$AMOUNT on CATEGORY: NOTE\"";
  }
}

// Main event function handler
exports.main = async (req, res) => {
  const { body, query } = req;
  console.log("Body", body);
  console.log("Query", query);

  const { command, token } = body;
  if (!verifyToken(token)) {
    console.log("Incorrect app token:", token);
    res.status(417).send("Who are you?");
    return;
  }

  let message;
  if (command === "/spend") {
    const { text } = body;
    const { spendOk, spendData } = parseSpend(text);
    console.log({ spendOk, spendData });
    message = spendMessage({ ok: spendOk, spendData });
  } else {
    message = `Command ${command} not recognized`;
  }

  res.status(200).send(message);
};
