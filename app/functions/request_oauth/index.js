function htmlRedirect(url) {
  return `<html><head><script>window.location.href="${url}";</script></head></html>`;
}

async function main(req, res) {
  const { query: { url } } = req;
  console.log("Redirecting to", url);
  res.status(200).send(htmlRedirect(url));
}

module.exports = {
  main,
};
