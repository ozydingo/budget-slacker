function main(req, res) {
  const { body } = req;
  const payload = body.payload ? JSON.parse(body.payload) : null;
  console.log("Got payload:", payload);

  res.status(200).send("✔");
}

module.exports = {
  main,
};
