import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken, AuthSession } from "@/lib/auth/crypto";

export async function getSessionFromCookies(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(COOKIE_NAME)?.value;
  if (!authCookie) return null;
  return verifySessionToken(authCookie);
}
