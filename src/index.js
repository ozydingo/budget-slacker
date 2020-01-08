const SPREADSHEET_ID = "17yMQaLLT0FFUNIlODUO-oHkPF4p_e5nBTZoGs7r5C7M";

// Main event function handler
exports.main = async (req, res) => {
  const { body, query } = req;
  console.log("Body", body);
  console.log("Query", query);

  const { command } = body;
  let status;
  let response;

  if (command === "/spend") {
    ({ status, response } = handleSpend(body));
  } else {
    res.status(400).send(`Command ${command} not recognized`);
  }

  res.status(status).send(response);
};

function handleSpend(body) {
  const { text, user_name, user_id } = body;
  const timestamp = (new Date()).getTime();
  const { ok, data } = parseSpend(text);

  if (!ok) { return { status: 400, response: "Invalid command format." }; }

  const { amount, category, note } = data;
  const conf = `Amount: ${amount}\nCategory: ${category}\nNote: ${note}`;
  console.log(conf);

  return {status: 200, response: conf};
}

function parseSpend(text) {
  const pattern = /\$?(\d+(?:\.\d{1,2})?)\s+(?:on\s+)?(.+?)(?:\s*:\s*(.*))?$/;
  const match = text.match(pattern);
  if (!match) { return {ok: false} };
  const [, amount, category, note] = text.match(pattern);
  return {ok: true, data: {amount, category, note}};
}
