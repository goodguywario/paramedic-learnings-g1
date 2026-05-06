import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const SESSION_COOKIE_NAME = "paramedic_session_user_id";

export interface SessionUser {
  id: number;
  email: string;
  name: string | null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const userIdStr = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!userIdStr) return null;

  const userId = Number(userIdStr);
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user || null;
}

export async function getOrCreateSessionUser(
  email: string,
  password: string,
  name: string = "User"
): Promise<SessionUser> {
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let user: SessionUser;

  if (existingUser) {
    user = existingUser;
  } else {
    const passwordHash = hashPassword(password);
    [user] = await db
      .insert(users)
      .values({ email, name, passwordHash })
      .returning();
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, String(user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return user;
}

export async function setSessionUser(userId: number): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, String(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return hashPassword(password) === hash;
}

export async function signUp(
  email: string,
  password: string,
  name: string = "User"
): Promise<SessionUser> {
  const passwordHash = hashPassword(password);

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const [newUser] = await db
    .insert(users)
    .values({ email, name, passwordHash })
    .returning();

  await setSessionUser(newUser.id);
  return newUser;
}

export async function signIn(
  email: string,
  password: string
): Promise<SessionUser> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    throw new Error("Invalid email or password");
  }

  await setSessionUser(user.id);
  return user;
}
