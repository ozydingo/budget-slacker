function reportTotals({totals}) {
  if (totals.length === 0) { return "Youu haven't spend anything this month yet!"; }
  totals.sort((a, b) => (b.values[0] - a.values[0]));
  let text = "What you've spent so far this month:\n";
  text += totals.filter(item => (
    item.values[0] > 0
  )).map(item => {
    return `${item.category}: $${item.values[0]}`;
  }).join("\n");
  return {text};
}

function confirmExpense({totals, expense}) {
  const { amount, category } = expense;
  const totalForCategory = totals.find(item => item.category.toLowerCase() === category.toLowerCase());
  const previousTotal = totalForCategory && Number(totalForCategory.values[0]) || 0;
  const total = previousTotal + Number(amount);
  const text = `You've spent $${total} so far this month on ${category}`;
  return {text};
}

function invalidSpreadsheetMessage() {
  return "Uh oh! I can't find your budget spreadsheet. Please contact support.";
}

function requestOauthBlocks({ oauthUrl }) {
  return {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "To start using Budget Slacker, you'll need to grant authorization to use Google Sheets.",
        }
      },
      {
        type: "actions",
        block_id: "oauth-access",
        elements: [
          {
            type: "button",
            value: "grant",
            style: "primary",
            text: {
              type: "plain_text",
              text: "Grant",
            },
            url: oauthUrl,
          },
          {
            type: "button",
            value: "cancel",
            text: {
              type: "plain_text",
              text: "Cancel",
            },
          },
        ]
      }
    ]
  };
}


module.exports = {
  confirmExpense,
  invalidSpreadsheetMessage,
  reportTotals,
  requestOauthBlocks,
};
