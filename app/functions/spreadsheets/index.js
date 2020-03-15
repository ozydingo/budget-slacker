const { google } = require("googleapis");

const templateSpreadsheetId = "1wxB-doRFGIlMRNAn9wTJ9ySyxl5V5M0WOyK0L1MRjsc";

function oauthClient({app_credentials, tokens}) {
  const { client_id, client_secret } = app_credentials;

  const client = new google.auth.OAuth2(
    client_id,
    client_secret,
  );
  client.setCredentials(tokens);

  return client;
}

// function sheetClient({app_credentials, tokens}) {
//   return google.sheets({version: "v4", auth: oauthClient({app_credentials, tokens})});
// }

function driveClient({app_credentials, tokens}) {
  return google.drive({version: "v3", auth: oauthClient({app_credentials, tokens})});
}

function copyTemplate({app_credentials, tokens}) {
  const drive = driveClient({app_credentials, tokens});
  return drive.files.copy({
    fileId: templateSpreadsheetId,
    resource: {
      name: "Budget Slacker"
    }
  });
}

async function create(req, res) {
  const { app_credentials, tokens } = req.body;
  const response = await copyTemplate({app_credentials, tokens});
  const spreadsheet_id = response.data.id;
  res.status(200).json({spreadsheet_id});
}

// async function get(req, res) {
//   const { app_credentials, spreadsheet_id, tokens } = req.body;
//   client.spreadsheets.get({spreadsheetId: spreadsheet_id});
// }

async function main(req, res) {
  const { action } = req.body;

  if (action === "create") {
    await create(req, res);
  } else {
    res.status(400).send("Bad action");
  }
}

module.exports = {
  main
};
