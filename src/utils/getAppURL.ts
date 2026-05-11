const defaultPorts: Record<string, number> = {
  "http:": 80,
  "https:": 443,
};

export function getAppURL() {
  let {
    APP_URL: href,
    APP_HOSTNAME: hostname = "localhost",
    APP_PORT: port = "3000",
  } = process.env;

  let protocol = "http:";

  if (href) {
    if (href.startsWith("//")) href = `${protocol}${href}`;
    else if (!href.includes("://")) href = `${protocol}//${href}`;
    else protocol = href.slice(0, href.indexOf("://") + 1);

    let matches = href.match(/^\w+:\/\/([^\/:]+)(:(\d+))?(\/|$)/);

    if (matches?.[1]) hostname = matches[1];
    if (matches?.[3]) port = matches[3];
  }
  else href = `${protocol}//${hostname}:${port}`;

  let parsedPort = Number(port);
  let origin = `${protocol}//${hostname}`;

  if (parsedPort !== defaultPorts[protocol]) origin += `:${port}`;

  return {
    href,
    origin,
    protocol,
    hostname,
    port: parsedPort,
  };
}
