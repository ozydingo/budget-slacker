const { google } = require("googleapis");

function sheetsClient({app_credentials, tokens}) {
  const { client_id, client_secret } = app_credentials;

  const client = new google.auth.OAuth2(
    client_id,
    client_secret,
  );
  client.setCredentials(tokens);

  const sheets = google.sheets({version: "v4", auth: client});
  return sheets;
}

module.exports = {
  sheetsClient
};
