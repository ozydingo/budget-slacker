const teams = require("./teams");

async function get(req, res) {
  const { team_id } = req.body;
  const team = await teams.find(team_id);
  const data = team ? team.data() : null;
  res.status(200).json(data);
}

async function update(req, res) {
  const { team_id, tokens, spreadsheet_id } = req.body;
  await teams.update(team_id, {tokens, spreadsheet_id});
  res.status(200).json({ok: true});
}

async function main(req, res) {
  const { action } = req.body;

  if (action === "get") {
    await get(req, res);
  } else if (action === "update") {
    await update(req, res);
  } else {
    res.status(400).send("Unknown action");
  }
}

module.exports = {
  main
};
