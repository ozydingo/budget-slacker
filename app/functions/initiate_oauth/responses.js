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
  requestOauthBlocks,
};
