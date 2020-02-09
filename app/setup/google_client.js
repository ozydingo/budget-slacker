const fs = require('fs');
const util = require('util');

const {google} = require('googleapis');

const readFile = util.promisify(fs.readFile);

const CREDENTIALS_PATH  = 'credentials.json';
const TOKEN_PATH = 'token.json';

async function getAuthorizedClient() {
  const credentials = JSON.parse(await readFile(CREDENTIALS_PATH));
  //TODO: remove redirect uris?
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]
  );

  const token = JSON.parse(await readFile(TOKEN_PATH));
  client.setCredentials(token);

  return client;
}

module.exports = {
  getAuthorizedClient,
}
