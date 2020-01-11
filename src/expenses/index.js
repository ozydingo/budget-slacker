const Spend = require("./spend");

const SPREADSHEET_ID = "1U-QJOVqqDV0fYxpLYQPp_opq-Vlh78pMcEsXlgvDT4k";

// Main event function handler
exports.main = async (req, res) => {
  const { body, query } = req;
  console.log("Body", body);
  console.log("Query", query);

  const { command } = body;
  let ok;
  let message;

  if (command === "/spend") {
    ({ ok, message } = await Spend.handleSpend(body, SPREADSHEET_ID));
  } else {
    ({ ok, message} = {ok: false, message: `Command ${command} not recognized` });
  }

  const status = ok ? 200 : 400;
  res.status(status).send(message);
};
