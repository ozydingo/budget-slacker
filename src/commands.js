const SPEND_PATTERN = /\$?(\d+(?:\.\d{1,2})?)\s+(?:on\s+)?(.+?)(?:\s*:\s*(.*))?$/;

function parseSpend(text) {
  const match = text.match(SPEND_PATTERN);
  if (!match) { return {ok: false} };
  const [, amount, category, note] = match;
  return {ok: true, data: {amount, category, note}};
}

module.exports = {
  parseSpend,
}
