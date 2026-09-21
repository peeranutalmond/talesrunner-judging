import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role, SessionUser } from "@/lib/db/types";

const COOKIE_NAME = "artventure_session";
const SESSION_SECONDS = 60 * 60 * 12;

function secret() {
  const configured = process.env.SESSION_SECRET;
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET is required in production");
  return "artventure-local-demo-secret-change-before-production";
}

function sign(input: string) {
  return crypto.createHmac("sha256", secret()).update(input).digest("base64url");
}

function encode(session: SessionUser) {
  const payload = Buffer.from(JSON.stringify({ ...session, exp: Date.now() + SESSION_SECONDS * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(token: string | undefined): SessionUser | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionUser & { exp: number };
    if (!parsed.id || !parsed.role || parsed.exp < Date.now()) return null;
    return { id: parsed.id, name: parsed.name, role: parsed.role, contestId: parsed.contestId };
  } catch {
    return null;
  }
}

export async function setSession(session: SessionUser) {
  const store = await cookies();
  store.set(COOKIE_NAME, encode(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_SECONDS,
    path: "/",
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  return decode(store.get(COOKIE_NAME)?.value);
}

export async function requireSession(roles?: Role[]) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (roles && !roles.includes(session.role)) redirect(session.role === "JUDGE" ? "/judge" : "/admin");
  return session;
}

export async function requireApiSession(roles?: Role[]) {
  const session = await getSession();
  if (!session || (roles && !roles.includes(session.role))) return null;
  return session;
}
