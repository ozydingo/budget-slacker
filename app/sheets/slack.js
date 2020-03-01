const axios = require("axios");

function respond({ response_type = "ephemeral", response_url, text }) {
  return axios({
    method: "POST",
    url: response_url,
    data: { response_type, text },
  });
}

module.exports = {
  respond
};
