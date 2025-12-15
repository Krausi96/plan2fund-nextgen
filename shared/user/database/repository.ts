// Minimal database repository stubs used by the new auth/profile APIs.
// These are intentionally simple and should be replaced with a real database
// implementation (e.g. Postgres, Supabase, etc.) for production use.

export interface UserRecord {
  id: number;
  email: string;
  password: string;
  name?: string | null;
  segment?: string | null;
  program_type?: string | null;
  industry?: string | null;
  language?: string | null;
  payer_type?: string | null;
  experience?: string | null;
  created_at: string;
  last_active_at: string | null;
  gdpr_consent?: boolean | null;
  password_hash?: string;
}

export interface SessionRecord {
  id: number;
  user_id: number;
  token: string;
  created_at: string;
  expires_at: string;
}

// In-memory store as a placeholder so that type-checking passes.
// This is NOT persistent and is only suitable for local development demos.
const users: UserRecord[] = [];
const sessions: SessionRecord[] = [];

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  return users.find((u) => u.email === email) ?? null;
}

export async function findUserById(id: number): Promise<UserRecord | null> {
  return users.find((u) => u.id === id) ?? null;
}

let nextUserId = 1;

export async function createUser(input: {
  email: string;
  password: string;
  name?: string;
  segment?: string;
}): Promise<UserRecord> {
  const now = new Date().toISOString();
  const user: UserRecord = {
    id: nextUserId++,
    email: input.email,
    password: input.password,
    name: input.name ?? null,
    segment: input.segment ?? null,
    created_at: now,
    last_active_at: now,
    program_type: null,
    industry: null,
    language: 'EN',
    payer_type: 'INDIVIDUAL',
    experience: 'NEWBIE',
    gdpr_consent: true,
  };
  users.push(user);
  return user;
}

export async function updateLastActive(userId: number): Promise<void> {
  const user = users.find((u) => u.id === userId);
  if (user) {
    user.last_active_at = new Date().toISOString();
  }
}

let nextSessionId = 1;

export async function createSession(
  userId: number,
  token: string,
  expiresAt: Date,
  ip?: string | string[] | undefined,
  userAgent?: string | string[] | undefined,
): Promise<SessionRecord> {
  const session: SessionRecord = {
    id: nextSessionId++,
    user_id: userId,
    token,
    created_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
  };
  void ip;
  void userAgent;
  sessions.push(session);
  return session;
}

export async function findSession(token: string): Promise<SessionRecord | null> {
  const now = Date.now();
  const session = sessions.find((s) => s.token === token && new Date(s.expires_at).getTime() > now);
  return session ?? null;
}

/**
 * Very small stub for password verification so that the new auth
 * endpoints can type-check without pulling in a real hashing library.
 *
 * NOTE: This is NOT secure and is only meant for local/demo usage
 * with the in-memory user store. For production, replace this with
 * a proper password hashing + verification implementation.
 */
export async function verifyPassword(user: UserRecord, password: string): Promise<boolean> {
  // Prefer password_hash if it exists, otherwise fall back to plain password
  if (user.password_hash) {
    // In a real implementation this would be something like:
    // return bcrypt.compare(password, user.password_hash);
    return user.password_hash === password;
  }

  return user.password === password;
}

/**
 * Remove a session from the in-memory store. This keeps the API surface
 * compatible with the logout endpoint while remaining intentionally simple.
 */
export async function deleteSession(token: string): Promise<void> {
  const index = sessions.findIndex((s) => s.token === token);
  if (index !== -1) {
    sessions.splice(index, 1);
  }
}

