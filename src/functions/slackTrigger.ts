import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { TableClient, TableEntity } from "@azure/data-tables";
import { uuid } from "uuidv4";

const sas = process.env.SAS_TOKEN;
const accountConnectionString = `BlobEndpoint=https://nhsappwdwstore.blob.core.windows.net/;QueueEndpoint=https://nhsappwdwstore.queue.core.windows.net/;FileEndpoint=https://nhsappwdwstore.file.core.windows.net/;TableEndpoint=https://nhsappwdwstore.table.core.windows.net/;SharedAccessSignature=sv=2022-11-02&ss=bfqt&srt=sco&sp=rwdlacupiyx&se=2024-07-30T19:11:15Z&st=2024-07-30T11:11:15Z&spr=https&sig=73h6tzUPy9oSZghkJ5jTCEqnCdV99o%2F7hjMRSiYsI0c%3D;SharedAccessSignature=${sas}`;

const tableName = "userConfiguration";

interface SlackRequest {
  user_id: string;
  user_name: string;
  command: string;
  text: string;
}

interface Entity extends TableEntity {
  slack_id: string;
  repo: string;
  glob: string;
}

enum SlackCommand {
  Subscribe = "subscribe",
  Subscriptions = "subscriptions",
  RemoveSubscription = "removeSubscription",
  TriggerChange = "triggerChange",
}

function getRepoName(text: string): string {
  return text.split(" ")[1];
}

function getGlobPattern(text: string): string {
  return text.split(" ")[2];
}

export async function slackTrigger(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`);

  const tableClient = TableClient.fromConnectionString(
    accountConnectionString,
    tableName
  );

  const body = await request.formData();
  const bodyText = body.get("text") as string;
  console.log(bodyText);

  if (bodyText.startsWith(SlackCommand.Subscribe)) {
    context.log(
      "Subscribe command",
      getRepoName(bodyText),
      getGlobPattern(bodyText)
    );

    const entity: Entity = {
      partitionKey: "user",
      rowKey: uuid(),
      slack_id: body.get("user_id") as string,
      repo: getRepoName(bodyText),
      glob: getGlobPattern(bodyText),
    };

    await tableClient.createEntity(entity);

    return { status: 200 };
  } else if (bodyText.startsWith(SlackCommand.Subscriptions)) {
    const entities = tableClient.listEntities<Entity>();
    let listOfSubscriptions = [];

    for await (const entity of entities) {
      console.log(entity);

      listOfSubscriptions.push(
        `Repo: ${entity.repo}, Glob: \`${entity.glob}\``
      );
    }

    const responseUrl = body.get("response_url") as string;
    console.log(responseUrl);

    const payload = {
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${listOfSubscriptions.join("\n")}*`,
          },
        },
      ],
    };

    await fetch(responseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } else if (bodyText.startsWith(SlackCommand.RemoveSubscription)) {
    context.log("RemoveSubscription command", bodyText);
  } else if (bodyText.startsWith(SlackCommand.TriggerChange)) {
    context.log("TriggerChange command", bodyText);
  } else {
    context.log("Unknown command", bodyText);
  }
}

app.http("slackTrigger", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: slackTrigger,
});
