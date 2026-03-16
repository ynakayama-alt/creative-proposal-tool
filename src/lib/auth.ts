import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-change-in-production"
);
const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
const ITERATIONS = 100000;
const DIGEST = "SHA-512";

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: ITERATIONS,
      hash: DIGEST,
    },
    keyMaterial,
    KEY_LENGTH * 8
  );

  const hashArray = new Uint8Array(derivedBits);
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const hashHex = Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${ITERATIONS}:${saltHex}:${hashHex}`;
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const [iterationsStr, saltHex, originalHashHex] = hash.split(":");
  const iterations = parseInt(iterationsStr, 10);

  const salt = new Uint8Array(
    saltHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
  );

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: DIGEST,
    },
    keyMaterial,
    KEY_LENGTH * 8
  );

  const derivedHashHex = Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return derivedHashHex === originalHashHex;
}

export async function createToken(userId: string): Promise<string> {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  return token;
}

export async function verifyToken(
  token: string
): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (typeof payload.userId === "string") {
      return { userId: payload.userId };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getSession(
  request?: Request
): Promise<{ userId: string } | null> {
  if (request) {
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) return null;

    const sessionMatch = cookieHeader.match(/session=([^;]+)/);
    if (!sessionMatch) return null;

    return verifyToken(sessionMatch[1]);
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");

  if (!sessionCookie?.value) {
    return null;
  }

  return verifyToken(sessionCookie.value);
}
