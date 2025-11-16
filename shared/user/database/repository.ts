/**
 * User Repository - Database operations for users
 * Replaces localStorage with actual database
 */
import { getPool } from '../../lib/database';
import bcrypt from 'bcryptjs';

export interface UserRecord {
  id: number;
  email: string;
  password_hash?: string | null;
  name?: string | null;
  segment: string;
  program_type: string;
  industry: string;
  language: string;
  payer_type: string;
  experience: string;
  gdpr_consent: boolean;
  email_verified: boolean;
  created_at: Date;
  last_active_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  email: string;
  password?: string;
  name?: string;
  segment?: string;
}

/**
 * Create a new user with password hashing
 */
export async function createUser(data: CreateUserData): Promise<UserRecord> {
  const pool = getPool();
  
  let passwordHash: string | null = null;
  if (data.password) {
    passwordHash = await bcrypt.hash(data.password, 10);
  }

  const result = await pool.query(
    `INSERT INTO users (email, password_hash, name, segment)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      data.email.toLowerCase(),
      passwordHash,
      data.name || null,
      data.segment || 'B2C_FOUNDER'
    ]
  );

  return result.rows[0];
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const pool = getPool();
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  
  return result.rows[0] || null;
}

/**
 * Find user by ID
 */
export async function findUserById(id: number): Promise<UserRecord | null> {
  const pool = getPool();
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  
  return result.rows[0] || null;
}

/**
 * Verify password
 */
export async function verifyPassword(user: UserRecord, password: string): Promise<boolean> {
  if (!user.password_hash) {
    return false; // User has no password (social login only)
  }
  return bcrypt.compare(password, user.password_hash);
}

/**
 * Update user last active timestamp
 */
export async function updateLastActive(userId: number): Promise<void> {
  const pool = getPool();
  await pool.query(
    'UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = $1',
    [userId]
  );
}

/**
 * Create or update OAuth provider connection
 */
export async function upsertOAuthProvider(
  userId: number,
  provider: string,
  providerUserId: string,
  accessToken?: string,
  refreshToken?: string,
  expiresAt?: Date
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO oauth_providers (user_id, provider, provider_user_id, access_token, refresh_token, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (provider, provider_user_id)
     DO UPDATE SET 
       user_id = $1,
       access_token = $4,
       refresh_token = $5,
       expires_at = $6,
       updated_at = CURRENT_TIMESTAMP`,
    [userId, provider, providerUserId, accessToken || null, refreshToken || null, expiresAt || null]
  );
}

/**
 * Find user by OAuth provider
 */
export async function findUserByOAuth(provider: string, providerUserId: string): Promise<UserRecord | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT u.* FROM users u
     JOIN oauth_providers o ON u.id = o.user_id
     WHERE o.provider = $1 AND o.provider_user_id = $2`,
    [provider, providerUserId]
  );
  
  return result.rows[0] || null;
}

/**
 * Create session token
 */
export async function createSession(
  userId: number,
  sessionToken: string,
  expiresAt: Date,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO user_sessions (user_id, session_token, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, sessionToken, expiresAt, ipAddress || null, userAgent || null]
  );
}

/**
 * Find session by token
 */
export async function findSession(sessionToken: string): Promise<{ user_id: number; expires_at: Date } | null> {
  const pool = getPool();
  const result = await pool.query(
    'SELECT user_id, expires_at FROM user_sessions WHERE session_token = $1 AND expires_at > CURRENT_TIMESTAMP',
    [sessionToken]
  );
  
  return result.rows[0] || null;
}

/**
 * Delete session (logout)
 */
export async function deleteSession(sessionToken: string): Promise<void> {
  const pool = getPool();
  await pool.query(
    'DELETE FROM user_sessions WHERE session_token = $1',
    [sessionToken]
  );
}

/**
 * Clean expired sessions
 */
export async function cleanExpiredSessions(): Promise<void> {
  const pool = getPool();
  await pool.query(
    'DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP'
  );
}

