import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { TableClient } from "@azure/data-tables";
import * as globToRegExp from "glob-to-regexp";
import { WebClient } from '@slack/web-api';

const sas = process.env.SAS_TOKEN;
const accountConnectionString=`BlobEndpoint=https://nhsappwdwstore.blob.core.windows.net/;QueueEndpoint=https://nhsappwdwstore.queue.core.windows.net/;FileEndpoint=https://nhsappwdwstore.file.core.windows.net/;TableEndpoint=https://nhsappwdwstore.table.core.windows.net/;SharedAccessSignature=${sas}`;
const tableName = 'userConfiguration';

const slackToken = process.env.SLACK_TOKEN;

export async function devopsTrigger(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);
    const slackClient = new WebClient(slackToken);

    const body: Record<string, any> = await request.json();
    const user = body.user;
    const commitUrl = body.commit_url;

    const files = body.files;
    console.log(files);

    // 1. TODO: Search database for globs that match body.files
    const tableClient = TableClient.fromConnectionString(accountConnectionString, tableName);

    const entities = tableClient.listEntities();
    const matchingEntities = [];
    for await (const entity of entities) {
        // For each entity, check if the glob matches any of the changed files.
        // N.B our files contain leading slashes, but the globs in the database do not.
        const regex = globToRegExp("/" + entity.glob);
        console.log(regex);
        const match = files.find(file => {
            console.log("regex.test", regex, file.name, regex.test(file.name));
            return regex.test(file.name);
        })

        console.log("match", match);

        if (match) {
            matchingEntities.push(entity);
        }
    }

    console.log(matchingEntities);
    // 2. TODO: For each matched record, send a message to the user

    matchingEntities.forEach(entity => {
        console.log(`Sending message to ${entity.userid}`);
        slackClient.chat.postMessage({
            channel: entity.slack_id,
            blocks: [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "Hi! Please note that some changes to files you're watching in the *nhsapp* repo are part of a Pull Request due to be implemented:"
                    }
                },
                {
                    "type": "divider"
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "/.azuredevops/templates/file1.yml"
                    }
                },
                {
                    "type": "divider"
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `:book: Changes were created by ${user}.\n\n :question: For more information, refer to <${commitUrl}|this Pull Request>.`
                    }
                }
            ]
        });
    });

    return;
};

app.http('devopsTrigger', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: devopsTrigger
});
