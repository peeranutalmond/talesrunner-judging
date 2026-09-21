export function isTrustedMutation(request: Request) {
  const fetchSite=request.headers.get("sec-fetch-site");
  if(fetchSite&&fetchSite!=="same-origin"&&fetchSite!=="same-site")return false;
  const origin=request.headers.get("origin");
  if(!origin)return process.env.NODE_ENV!=="production";
  try {
    const originHost=new URL(origin).host;
    const requestHost=request.headers.get("x-forwarded-host")??request.headers.get("host")??new URL(request.url).host;
    return originHost===requestHost;
  } catch { return false; }
}
