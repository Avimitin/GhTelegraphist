import {
  Application,
  Context,
  Router,
  Status,
} from "https://deno.land/x/oak@v11.1.0/mod.ts";

const botToken = "";
const toChannel = "";
const tgapi = `https://api.telegram.org/bot${botToken}/sendMessage`;

interface PushEvent {
  payload: {
    commits: {
      author: {
        name: string;
      };
      message: string;
      url: string;
    }[];
  };
}

async function send_message(str: string) {
  const param = {
    chat_id: toChannel,
    text: str,
    parse_mode: "HTML",
  };

  const req = new Request(tgapi, {
    method: "POST",
    headers: new Headers({ "Content-Type": "application/json" }),
    body: JSON.stringify(param),
  });

  const resp = await fetch(req);
  if (resp.status !== 200) {
    console.error(await resp.text());
  }
}

const app = new Application();
const router = new Router();
router.post("/payload", async (ctx: Context) => {
  const { headers } = ctx.request;

  const contentType = headers.get("Content-Type") ||
    headers.get("content-type");
  ctx.assert(contentType, Status.BadRequest);
  ctx.assert(contentType === "application/json", Status.BadRequest);

  let text;
  try {
    const obj = await ctx.request.body({ type: "json" }).value as PushEvent;
    const display = obj.payload.commits.reduce((folded, current) => {
      return `${folded}* <a href="${current.url}">${current.message}</a>\n`;
    }, "");

    text = `${
      obj.payload.commits[0].author.name
    } push new commits: \n${display}`;
  } catch (e) {
    text = `fail to parse GitHub request: ${e}`;
    console.log(text);
  }

  await send_message(text);
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log("Listening on 11451");
app.listen({ port: 11451 });
