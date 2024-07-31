import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { TableClient, TableEntity } from "@azure/data-tables";
import { uuid } from "uuidv4";

const sas = process.env.SAS_TOKEN;
const accountConnectionString = `BlobEndpoint=https://nhsappwdwstore.blob.core.windows.net/;QueueEndpoint=https://nhsappwdwstore.queue.core.windows.net/;FileEndpoint=https://nhsappwdwstore.file.core.windows.net/;TableEndpoint=https://nhsappwdwstore.table.core.windows.net/;SharedAccessSignature=sv=2022-11-02&ss=t&srt=sco&sp=rwdlacu&se=2024-08-02T17:24:30Z&st=2024-07-31T09:24:30Z&spr=https&sig=My31OjQawF3oK4aOxDg3N4jMWl9NK4fgT%2Fx1Nysuqj4%3D`;

const tableName = "userConfiguration";

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
  Help = "help",
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

    return {
      body: `You are now subscribed to the \`${getRepoName(
        bodyText
      )}\` repository. Tracking files - \`${getGlobPattern(bodyText)}\``,
      status: 200,
    };
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
  } else if (bodyText.startsWith(SlackCommand.Help)) {
    return {
      body: `You can do the following:\n
      \`\/whodidwhat subscriptions\` - shows a list of your current subscriptions\n
      \`\/whodidwhat subscribe <repo_name> <glob_pattern>\` - Create a new subscription for the <repo_name> repo and any files matching <glob_pattern>`,
      status: 200,
    };
  } else {
    context.log("Unknown command", bodyText);
  }
}

app.http("slackTrigger", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: slackTrigger,
});
