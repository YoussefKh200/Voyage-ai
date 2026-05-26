import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

const USERS_FILE = path.join(process.cwd(), "data", "users.json");

async function loadUsers(): Promise<UserRecord[]> {
  try {
    const content = await fs.readFile(USERS_FILE, "utf8");
    return JSON.parse(content) as UserRecord[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function saveUsers(users: UserRecord[]) {
  await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

export async function findUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const users = await loadUsers();
  return users.find((user) => user.email === normalized) ?? null;
}

export async function createUser(email: string, passwordHash: string) {
  const normalized = email.trim().toLowerCase();
  const existing = await findUserByEmail(normalized);
  if (existing) {
    throw new Error("User already exists");
  }

  const users = await loadUsers();
  const user: UserRecord = {
    id: randomUUID(),
    email: normalized,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await saveUsers(users);
  return user;
}
