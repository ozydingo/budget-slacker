const {google} = require('googleapis');

const Commands = require("./commands");

const SPREADSHEET_ID = "1U-QJOVqqDV0fYxpLYQPp_opq-Vlh78pMcEsXlgvDT4k";
const { client_id, client_secret, access_token, refresh_token } = process.env;
const credentials = { access_token, refresh_token };

let sheets;

// Main event function handler
exports.main = async (req, res) => {
  const { body, query } = req;
  console.log("Body", body);
  console.log("Query", query);

  const { command } = body;
  let status;
  let response;

  if (command === "/spend") {
    ({ status, response } = await handleSpend(body));
  } else {
    res.status(400).send(`Command ${command} not recognized`);
  }

  res.status(status).send(response);
};

function sheets() {
  if (sheets) { return sheets; }

  const client = new google.auth.OAuth2(client_id, client_secret);
  client.setCredentials(credentials);
  sheets = google.sheets({version: 'v4', client: client})
  return sheets
}

async function handleSpend(body) {
  const { text, user_name, user_id } = body;
  const timestamp = (new Date()).getTime();
  const { ok, data } = Commands.parseSpend(text);
  if (!ok) { return { status: 400, response: "Invalid command format." }; }

  const { amount, category, note } = data;
  const conf = `Amount: ${amount}\nCategory: ${category}\nNote: ${note}`;
  console.log(conf);

  const appendResult = await Sheets.appendSpend(
    SPREADSHEET_ID,
    { timestamp, user_id, user_name, amount,  category, note }
  )
  console.log(appendResult);

  return {status: 200, response: conf};
}
