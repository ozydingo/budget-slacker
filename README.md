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

## How to find out what the f#@& to do

Starting point in a browser:

```
https://developers.google.com/discovery/v1/reference/apis
```

then curl

```
https://www.googleapis.com/discovery/v1/apis
```

Filter this by `cloudfunctions` to find

```
curl https://www.googleapis.com/discovery/v1/apis?name=cloudfunctions

...
"discoveryRestUrl": "https://cloudfunctions.googleapis.com/$discovery/rest?version=v1",
...
```

Follow this link, noting not to allow bash to expand the `$`:

```
curl  'https://cloudfunctions.googleapis.com/$discovery/rest?version=v1'
```

This output gives you the full schema for the cloudfunctions configuration file.

## Invocation permissions

From `https://cloudfunctions.googleapis.com/v1/{resource}:getIamPolicy`, we get:

```
{
  "version": 1,
  "etag": "BwWe0NiFjeI=",
  "bindings": [
    {
      "role": "roles/cloudfunctions.invoker",
      "members": [
        "allUsers"
      ]
    }
  ]
}
```

We should therefore call `setIamPolicy` to remove this. This isn't great since there's a brief second where the function is exposed. Perhaps we can create the function, update the IamPolicy, *then* add the code. This would be called at `curl -X GET https://cloudfunctions.googleapis.com/v1/projects/budget-slacker/locations/us-east1/functions/get-team-info-function:getIamPolicy`

To do this in the template, we give `526411321629@cloudbuild.gserviceaccount.com` Cloud Function Admin permissions.
