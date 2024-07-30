import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { TableClient } from "@azure/data-tables";
import * as globToRegExp from "glob-to-regexp";

const sas = process.env.SAS_TOKEN;
const accountConnectionString=`BlobEndpoint=https://nhsappwdwstore.blob.core.windows.net/;QueueEndpoint=https://nhsappwdwstore.queue.core.windows.net/;FileEndpoint=https://nhsappwdwstore.file.core.windows.net/;TableEndpoint=https://nhsappwdwstore.table.core.windows.net/;SharedAccessSignature=sv=2022-11-02&ss=bfqt&srt=sco&sp=rwdlacupiyx&se=2024-07-30T19:11:15Z&st=2024-07-30T11:11:15Z&spr=https&sig=73h6tzUPy9oSZghkJ5jTCEqnCdV99o%2F7hjMRSiYsI0c%3D;SharedAccessSignature=${sas}`

const tableName = 'userConfiguration';

export async function devopsTrigger(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const body: Record<string, any> = await request.json();
    const user = body.user;

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
        const match = files.find(file => {
            return regex.test(file.name)
        })

        if (match) {
            matchingEntities.push(entity);
        }
    }

    console.log(matchingEntities);
    // 2. TODO: For each matched record, send a message to the user

    matchingEntities.forEach(entity => {
        console.log(`Sending message to ${entity.userid}`);
    });

    return;
};

app.http('devopsTrigger', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: devopsTrigger
});
