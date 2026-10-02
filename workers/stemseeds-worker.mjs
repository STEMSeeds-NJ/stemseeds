const MARKDOWN = "text/markdown; charset=utf-8";

function acceptsMarkdown(request) {
  return request.headers.get("Accept")?.toLowerCase().split(",").some((value) => {
    const [mediaType, ...parameters] = value.trim().split(";");
    if (mediaType !== "text/markdown") return false;
    const quality = parameters.find((parameter) => parameter.trim().startsWith("q="));
    return !quality || Number(quality.split("=")[1]) > 0;
  }) ?? false;
}

function withNegotiationHeaders(response, contentType = response.headers.get("Content-Type")) {
  const headers = new Headers(response.headers);
  headers.set("Vary", "Accept");
  if (contentType) headers.set("Content-Type", contentType);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function readOriginAsset(path, request, env) {
  if (!env.ORIGIN_URL) throw new Error("ORIGIN_URL must identify the GitHub Pages origin.");
  const originUrl = new URL(env.ORIGIN_URL);
  const originBasePath = originUrl.pathname.endsWith("/") ? originUrl.pathname.slice(0, -1) : originUrl.pathname;
  originUrl.pathname = `${originBasePath}${path}`;
  originUrl.search = new URL(request.url).search;
  return fetch(originUrl);
}

export default {
  async fetch(request, env) {
    if (!env.ORIGIN_URL) throw new Error("ORIGIN_URL must identify the GitHub Pages origin.");
    const originUrl = new URL(request.url);
    const origin = new URL(env.ORIGIN_URL);
    const originBasePath = origin.pathname.endsWith("/") ? origin.pathname.slice(0, -1) : origin.pathname;
    origin.pathname = `${originBasePath}${originUrl.pathname === "/" ? "/" : originUrl.pathname}`;
    origin.search = originUrl.search;
    const originResponse = await fetch(new Request(origin, request));
    if (!acceptsMarkdown(request)) return withNegotiationHeaders(originResponse);

    if (originUrl.pathname === "/" || originUrl.pathname === "/index.html") {
      return new Response(await readOriginAsset("/index.md", request, env).then((response) => response.text()), {
        status: 200,
        headers: { "Content-Type": MARKDOWN, "Vary": "Accept" }
      });
    }
    if (originResponse.status === 404) {
      return new Response(await readOriginAsset("/404.md", request, env).then((response) => response.text()), {
        status: 404,
        headers: { "Content-Type": MARKDOWN, "Vary": "Accept" }
      });
    }
    return withNegotiationHeaders(originResponse);
  }
};
