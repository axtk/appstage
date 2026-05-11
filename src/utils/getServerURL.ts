const defaultPorts: Record<string, number> = {
  "http:": 80,
  "https:": 443,
};

export function getServerURL() {
  let {
    SERVER_URL: href,
    SERVER_HOSTNAME: hostname = "localhost",
    SERVER_PORT: port = "3000",
  } = process.env;

  let protocol = "http:";

  if (href) {
    if (href.startsWith("//")) href = `${protocol}${href}`;
    else if (!href.includes("://")) href = `${protocol}//${href}`;
    else protocol = href.slice(0, href.indexOf("://") + 1);

    let matches = href.match(/^\w+:\/\/([^/:]+)(:(\d+))?(\/|$)/);

    if (matches?.[1]) hostname = matches[1];
    if (matches?.[3]) port = matches[3];
  } else href = `${protocol}//${hostname}:${port}`;

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
