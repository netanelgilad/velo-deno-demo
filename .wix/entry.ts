import { createClient, SPIDefinition, WixAppOAuthStrategy } from "@wix/sdk";
import { AsyncLocalStorageContext } from "@wix/sdk/context";
import * as eventHandlers from "../src/backend/events.js";
import * as httpFunctions from "../src/backend/http-functions.js";
import * as shippingSPI from "../src/backend/___spi___/ecom-shipping-rates/NetaShipping/NetaShipping.js";
import { eventTypeToFunctionMap } from "./eventTypeToFunctionMap.ts";
import { DomainEvent, DomainEventMetadata } from "npm:@wix/metro-runtime/velo";
import { spiPathtoFunctionMap } from "./spiPathToFunctionMap.ts";
import { AsyncLocalStorage } from "node:async_hooks";

Deno.serve(async (req, info) => {
  const url = new URL(req.url);

  const pathname = url.pathname;

  const wixClient = createClient({
    auth: WixAppOAuthStrategy({
      appId: Deno.env.get("APP_ID")!,
      appSecret: Deno.env.get("APP_SECRET")!,
      publicKey: Deno.env.get("APP_PUBLIC_KEY")!,
    }),
  });

  AsyncLocalStorageContext.init(AsyncLocalStorage);

  if (pathname.startsWith("/_api/webhooks")) {
    const { eventType, instanceId, payload } =
      await wixClient.webhooks.processRequest(req);

    const eventHandlerFunctionName = eventTypeToFunctionMap[eventType];

    if (!eventHandlerFunctionName) {
      console.log(
        `event type ${eventType} does not have a corresponding function in the event type to function map`
      );
      return new Response("OK");
    }

    // @ts-expect-error - we know that the function name is a valid key
    const eventHandler = eventHandlers[eventHandlerFunctionName];

    if (!eventHandler) {
      console.log(
        `event type ${eventType} does not have a corresponding function in the eventHandlers`
      );
      return new Response("OK");
    }

    //   const instanceClient = wixClient.withAuth({ instanceId });
    const asVeloEvent = toVeloEvent(payload as DomainEvent);

    await AsyncLocalStorageContext.run(
      wixClient.withAuth({ instanceId }).auth as any,
      async () => {
        await eventHandler(asVeloEvent);
      }
    );
    return new Response("OK");
  }

  if (pathname.startsWith("/_functions/")) {
    const requestedFunction = pathname.split("/").pop();
    if (!requestedFunction) {
      console.log("No function name in the path");
      return new Response("Not found", { status: 404 });
    }
    const functionName = `${req.method.toLowerCase()}_${requestedFunction}`;

    // @ts-expect-error - we know that the function name is a valid key
    const handler = httpFunctions[functionName];

    if (!handler) {
      console.log(`Function ${functionName} not found`);
      return new Response("Not found", { status: 404 });
    }

    const baseUrl = req.url.substring(
      0,
      req.url.indexOf("/_functions/") + "/_functions/".length
    );

    const veloRequest = {
      baseUrl,
      body: {
        text: () => req.text(),
        json: () => req.json(),
        buffer: () => req.arrayBuffer(),
      },
      functionName: requestedFunction,
      headers: Object.fromEntries(req.headers.entries()),
      ip: info.remoteAddr.hostname,
      method: req.method,
      path: new URL(req.url).pathname.substring(
        "_functions/".length + requestedFunction.length
      ),
      query: Object.fromEntries(new URL(req.url).searchParams.entries()),
      url: req.url,
    };

    const res = await handler(veloRequest);

    return res;
  }

  if (pathname.startsWith("/_spi/ecom-shippping-rates/NetaShipping/")) {
    const spiMethodPath = pathname.substring(
      "/_spi/ecom-shippping-rates/NetaShipping/".length
    );
    if (!spiMethodPath) {
      console.log("No function name in the path");
      return new Response("Not found", { status: 404 });
    }

    // @ts-expect-error - we know that the function name is a valid key
    const handler = shippingSPI[spiPathtoFunctionMap[spiMethodPath]];

    if (!handler) {
      console.log(`Function for ${spiMethodPath} not found`);
      return new Response("Not found", { status: 404 });
    }

    const { request, metadata } = await wixClient
      .spi<
        SPIDefinition<
          { request: unknown; metadata: { instanceId: string } },
          unknown
        >
      >()
      .processRequest(req);

    console.log(request, metadata);

    const res = await AsyncLocalStorageContext.run(
      wixClient.withAuth({ instanceId: metadata.instanceId }).auth as any,
      () => {
        return handler(request, metadata);
      }
    );

    return Response.json(res);
  }

  return new Response("Not found", { status: 404 });
});

export function toVeloEvent(domainEvent: DomainEvent): VeloEvent {
  const veloEvent: VeloEvent = { metadata: toMetadata(domainEvent) };

  if (!domainEvent.deletedEvent) {
    const { key, payload } = toVeloPayload(domainEvent);

    veloEvent[key] = payload;
  }

  return veloEvent;
}

function toVeloPayload(domainEvent: DomainEvent) {
  const payload = extractDomainEventPayload(domainEvent);
  const key: keyof VeloEvent = domainEvent.actionEvent ? "data" : "entity";

  return { key, payload };
}

// deno-lint-ignore no-explicit-any
export function extractDomainEventPayload(parsedDomainEvent: any) {
  const event =
    parsedDomainEvent.createdEvent?.entity ||
    parsedDomainEvent.actionEvent?.body ||
    parsedDomainEvent.updatedEvent?.currentEntity;

  if (event) {
    return event;
  }

  throw new Error("Invalid Domain Event structure detected");
}

function toMetadata(domainEvent: DomainEvent) {
  return {
    id: domainEvent.id,
    entityId: domainEvent.entityId,
    eventTime: domainEvent.eventTime,
    triggeredByAnonymizeRequest: domainEvent.triggeredByAnonymizeRequest,
  };
}

type VeloEvent = {
  metadata: DomainEventMetadata;
  data?: unknown;
  entity?: unknown;
};
