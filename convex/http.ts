import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";



const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!
const handleClerkWebhook = httpAction(async (ctx, request) => {
  const event = await validateRequest(request);
  if (!event) {
    return new Response("Error occurred", {
      status: 400,
    });
  }
  switch (event.type) {
    case "user.created": {
      await ctx.runMutation(internal.users.createUser, {
        name: event.data.first_name ? `${event.data.first_name} ${event.data.last_name || ""}`.trim() : event.data.email_addresses[0].email_address,
        email: event.data.email_addresses[0].email_address,
        tokenIdentifier: event.data.id
      });
      break;
    }
    case "user.updated": {
      // Handle user updates if needed
      break;
    }
    case "user.deleted": {
      // Handle user deletion
      if (event.data.id) {
        await ctx.runMutation(internal.users.deleteUser, {
          tokenIdentifier: event.data.id,
        });
      }
      break;
    }
    default: {
      console.log("ignored Clerk webhook event", event.type);
    }
  }
  return new Response(null, {
    status: 200,
  });
});

const http = httpRouter();
http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: handleClerkWebhook,
});

async function validateRequest(
  req: Request
): Promise<WebhookEvent | undefined> {
  const payloadString = await req.text();

  const svixHeaders = {
    "svix-id": req.headers.get("svix-id")!,
    "svix-timestamp": req.headers.get("svix-timestamp")!,
    "svix-signature": req.headers.get("svix-signature")!,
  };
  const wh = new Webhook(webhookSecret);
  let evt: Event | null = null;
  try {
    evt = wh.verify(payloadString, svixHeaders) as Event;
  } catch (_) {
    console.log("error verifying");
    return;
  }

  return evt as unknown as WebhookEvent;
}

export default http;