const axios = require("axios");

const metadataServerTokenUrlBase = "http://metadata/computeMetadata/v1/instance/service-accounts/default/identity?audience=";

function getInvocationToken(functionUrl) {
  const metadataUrl = metadataServerTokenUrlBase + encodeURIComponent(functionUrl);
  console.log("Requesting metadata from " + metadataUrl);
  return axios({
    method: "GET",
    url: metadataUrl,
    headers: {
      "Metadata-Flavor": "Google"
    }
  }).then(response => response.data);
}

async function invokeFunction(url, data){
  const token = await getInvocationToken(url);
  console.log("Invocation token: " + token);
  const headers = {
    Authorization: `bearer ${token}`,
    "Content-type": "application/json",
  };

  console.log(`Invoking function at ${url} with data`, data);
  const response = await axios({
    method: "POST",
    url,
    headers,
    data,
  });
  console.log("Response: ", response.data);

  return response.data;
}

module.exports = {
  invokeFunction,
};
