# budget-slacker
A simple budgeting app using Slack and Google Sheets

Following the quickstart here: https://developers.google.com/sheets/api/quickstart/nodejs

1. In the Google Cloud Console, Enable the Google Sheets API.
2. Add credentials of type OAuth Client ID, selecting application type "Other". Name the app "Budget Slacker Setup".
3. Download the credentials into the file `credentials.json` in this folder.
4. Delete the `token.json` file if it exists and isn't correct.
5. Run `node ./init.js` to create a spreadsheet. This returns the spreadhsheet id, which should be stored for the app to use. This script also gets and stores an OAuth token if it does not exist in in `token.json`.

Slack integration

1. Build a slack app
2. Add a slash command: `/spend`
3. Install app to workspace

## Deploying via Deployment Manager

from the `src` directory:

```
gcloud deployment-manager deployments update budget-slacker --config budget-slacker.yml
```
