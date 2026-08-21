import crypto from "crypto";

const DEV_FALLBACK = "archos-development-only-jwt-secret";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production; refusing to use a built-in secret");
  }

  return DEV_FALLBACK;
}

export function signHs256Jwt(payload: Record<string, unknown>, ttlSeconds = 3600): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds
  })).toString("base64url");
  const signature = crypto.createHmac("sha256", getJwtSecret()).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyHs256Jwt(token: string): Record<string, unknown> {
  const [header, body, signature] = token.split(".");
  if (!header || !body || !signature) throw new Error("Malformed JWT");

  const expected = crypto.createHmac("sha256", getJwtSecret()).update(`${header}.${body}`).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error("Invalid JWT signature");
  }

  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (typeof payload.exp === "number" && payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error("JWT expired");
  }
  return payload;
}
