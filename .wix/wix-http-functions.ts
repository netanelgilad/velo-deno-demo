export function ok(options: {
  body: string | object | ArrayBuffer;
  headers: Record<string, string>;
}) {
  return new Response(
    options.body instanceof ArrayBuffer
      ? options.body
      : typeof options.body === "object"
      ? JSON.stringify(options.body)
      : options.body,
    { status: 200, headers: options.headers }
  );
}

export function badRequest(options: {
  body: string | object | ArrayBuffer;
  headers: Record<string, string>;
}) {
  return new Response(
    options.body instanceof ArrayBuffer
      ? options.body
      : typeof options.body === "object"
      ? JSON.stringify(options.body)
      : options.body,
    { status: 400, headers: options.headers }
  );
}

export function created(options: {
  body: string | object | ArrayBuffer;
  headers: Record<string, string>;
}) {
  return new Response(
    options.body instanceof ArrayBuffer
      ? options.body
      : typeof options.body === "object"
      ? JSON.stringify(options.body)
      : options.body,
    { status: 201, headers: options.headers }
  );
}

export function forbidden(options: {
  body: string | object | ArrayBuffer;
  headers: Record<string, string>;
}) {
  return new Response(
    options.body instanceof ArrayBuffer
      ? options.body
      : typeof options.body === "object"
      ? JSON.stringify(options.body)
      : options.body,
    { status: 403, headers: options.headers }
  );
}

export function notFound(options: {
  body: string | object | ArrayBuffer;
  headers: Record<string, string>;
}) {
  return new Response(
    options.body instanceof ArrayBuffer
      ? options.body
      : typeof options.body === "object"
      ? JSON.stringify(options.body)
      : options.body,
    { status: 404, headers: options.headers }
  );
}

export function serverError(options: {
  body: string | object | ArrayBuffer;
  headers: Record<string, string>;
}) {
  return new Response(
    options.body instanceof ArrayBuffer
      ? options.body
      : typeof options.body === "object"
      ? JSON.stringify(options.body)
      : options.body,
    { status: 500, headers: options.headers }
  );
}

export function response(options: {
  body: string | object | ArrayBuffer;
  headers: Record<string, string>;
  status: number;
}) {
  return new Response(
    options.body instanceof ArrayBuffer
      ? options.body
      : typeof options.body === "object"
      ? JSON.stringify(options.body)
      : options.body,
    { status: options.status, headers: options.headers }
  );
}
