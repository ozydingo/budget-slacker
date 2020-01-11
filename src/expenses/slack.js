const axios = require("axios");

function respond(response_url, text) {
  axios({
    method: "POST",
    url: response_url,
    data: { text },
  });
}

module.exports = {
  respond
};
