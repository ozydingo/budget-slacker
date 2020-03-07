function main(req, res) {
  const {body, query} = req;
  console.log({body, query});
  res.status(200).send("ok");
}

module.exports = {
  main,
};
