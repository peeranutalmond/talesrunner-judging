export function isTrustedMutation(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "same-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host.split(":")[0];
    const xForwardedHost = (request.headers.get("x-forwarded-host") ?? "").split(":")[0];
    const hostHeader = (request.headers.get("host") ?? "").split(":")[0];
    const urlHost = new URL(request.url).host.split(":")[0];

    if (originHost === xForwardedHost || originHost === hostHeader || originHost === urlHost) return true;
    if (originHost.endsWith(".netlify.app") || originHost === "localhost" || originHost === "127.0.0.1") return true;
    return false;
  } catch {
    return false;
  }
}

