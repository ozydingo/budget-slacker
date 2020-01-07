const fs = require('fs');
const {google} = require('googleapis');

const readFile = util.promisify(fs.readFile);

const CREDENTIALS_PATH  = 'credentials.json';
const TOKEN_PATH = 'token.json';

async function getAuthorizedClient() {
  const creds = await readFile(CREDENTIALS_PATH);
  //TODO: remove redirect uris?
  const { client_secret, client_id, redirect_uris } = JSON.parse(creds).installed;
  const client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]
  );

  const tokenData = await readFile(TOKEN_PATH);
  client.setCredentials(JSON.parse(tokenData));

  return client;
}

module.exports = {
  getAuthorizedClient,
}
