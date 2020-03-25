const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");

async function getSecret(versionString) {
  const secretsClient = new SecretManagerServiceClient();
  const secretData = await secretsClient.accessSecretVersion({
    name: versionString
  });
  const secret = secretData[0].payload.data.toString("utf8");
  const credentials = JSON.parse(secret);
  return credentials;
}

module.exports = {
  getSecret,
};
