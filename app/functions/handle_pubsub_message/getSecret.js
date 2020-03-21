const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");

async function getSecret(versionString) {
  const secretsClient = new SecretManagerServiceClient();
  const secretData = await secretsClient.accessSecretVersion({
    name: versionString
  });
  const secret = secretData[0].payload.data.toString("utf8");
  return secret;
}

async function getJsonSecret(versionString) {
  const rawSecret = await getSecret(versionString);
  const secret = JSON.parse(rawSecret);
  return secret;
}

module.exports = {
  getJsonSecret,
  getSecret,
};
