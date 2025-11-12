/**
 * Login/Authentication Utilities
 * Handles manual login for sites that require authentication
 * 
 * SECURITY NOTE: Credentials should be stored securely (encrypted, environment variables)
 */

import { fetchHtml } from '../utils';
import * as cheerio from 'cheerio';

export interface LoginConfig {
  enabled?: boolean; // Whether login is enabled for this institution
  url: string; // Login page URL
  loginUrl?: string; // Alias for url (for backward compatibility)
  email?: string; // Email/username (from env var)
  password?: string; // Password (from env var, should be encrypted in production)
  loginFormSelector?: string; // e.g., 'form#login-form'
  emailFieldSelector?: string; // e.g., 'input[name="email"]'
  passwordFieldSelector?: string; // e.g., 'input[name="password"]'
  submitButtonSelector?: string; // e.g., 'button[type="submit"]'
  sessionCookieName?: string; // e.g., 'session_id'
}

export interface LoginResult {
  success: boolean;
  sessionCookie?: string;
  cookies?: Record<string, string>;
  error?: string;
}

/**
 * Attempt to login to a site (manual configuration required)
 * 
 * WARNING: This is a basic implementation. Real-world login might require:
 * - CSRF tokens
 * - Multi-step authentication
 * - CAPTCHA handling
 * - Session management
 * 
 * Use with caution and test thoroughly.
 */
export async function loginToSite(config: LoginConfig): Promise<LoginResult> {
  try {
    // Use loginUrl if provided, otherwise url
    const loginUrl = config.loginUrl || config.url;
    if (!loginUrl) {
      return {
        success: false,
        error: 'Login URL not provided'
      };
    }
    
    if (!config.email || !config.password) {
      return {
        success: false,
        error: 'Email or password not provided'
      };
    }
    
    // Fetch login page
    const loginPage = await fetchHtml(loginUrl);
    
    if (loginPage.status !== 200) {
      return {
        success: false,
        error: `Failed to fetch login page: HTTP ${loginPage.status}`
      };
    }
    
    const $ = cheerio.load(loginPage.html);
    
    // Find login form
    const formSelector = config.loginFormSelector || 'form';
    const form = $(formSelector).first();
    
    if (form.length === 0) {
      return {
        success: false,
        error: 'Login form not found'
      };
    }
    
    // Find email and password fields
    const emailSelector = config.emailFieldSelector || 'input[type="email"], input[name*="email"], input[name*="user"], input[id*="email"]';
    const passwordSelector = config.passwordFieldSelector || 'input[type="password"]';
    // const submitSelector = config.submitButtonSelector || 'button[type="submit"], input[type="submit"]'; // Reserved for future use
    
    const emailField = form.find(emailSelector).first();
    const passwordField = form.find(passwordSelector).first();
    
    if (emailField.length === 0 || passwordField.length === 0) {
      return {
        success: false,
        error: 'Email or password field not found'
      };
    }
    
    // Get form action URL
    const formAction = form.attr('action') || loginUrl;
    const formMethod = form.attr('method') || 'POST';
    const actionUrl = formAction.startsWith('http') 
      ? formAction 
      : new URL(formAction, loginUrl).toString();
    
    // Extract CSRF token if present
    const csrfToken = form.find('input[name*="csrf"], input[name*="token"], input[name*="_token"]').attr('value') || '';
    
    // Build form data
    const formData: Record<string, string> = {};
    form.find('input[type="hidden"]').each((_, el) => {
      const name = $(el).attr('name');
      const value = $(el).attr('value') || '';
      if (name) formData[name] = value;
    });
    
    // Add credentials
    const emailFieldName = emailField.attr('name') || 'email';
    const passwordFieldName = passwordField.attr('name') || 'password';
    formData[emailFieldName] = config.email;
    formData[passwordFieldName] = config.password;
    
    if (csrfToken) {
      // Try to find CSRF token field name
      const csrfField = form.find('input[name*="csrf"], input[name*="token"]').attr('name');
      if (csrfField) {
        formData[csrfField] = csrfToken;
      }
    }
    
    // Submit login form
    // NOTE: This is a simplified implementation
    // Real implementation would need to handle cookies, redirects, etc.
    const response = await fetch(actionUrl, {
      method: formMethod,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': loginUrl,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: new URLSearchParams(formData).toString(),
      redirect: 'follow'
    });
    
    // Extract cookies from response
    const cookies: Record<string, string> = {};
    const setCookieHeaders = response.headers.getSetCookie?.() || [];
    
    setCookieHeaders.forEach(cookie => {
      const [nameValue] = cookie.split(';');
      const [name, value] = nameValue.split('=');
      if (name && value) {
        cookies[name.trim()] = value.trim();
      }
    });
    
    // IMPROVED: Better login success detection and error messages
    const responseText = await response.text().toLowerCase();
    const responseUrl = response.url.toLowerCase();
    
    // Check for specific error patterns
    const hasInvalidCredentials = responseText.includes('invalid') || 
                                  responseText.includes('wrong') ||
                                  responseText.includes('incorrect') ||
                                  responseText.includes('ungültig') ||
                                  responseText.includes('falsch');
    
    const hasCaptcha = responseText.includes('captcha') || 
                      responseText.includes('recaptcha') ||
                      responseText.includes('verify you are human');
    
    const hasAccountLocked = responseText.includes('locked') || 
                            responseText.includes('blocked') ||
                            responseText.includes('gesperrt');
    
    const hasTwoFactor = responseText.includes('2fa') || 
                        responseText.includes('two-factor') ||
                        responseText.includes('verification code');
    
    const isSuccess = !hasInvalidCredentials && 
                     !hasCaptcha && 
                     !hasAccountLocked &&
                     !hasTwoFactor &&
                     !responseText.includes('error') &&
                     !responseText.includes('failed') &&
                     response.status >= 200 && 
                     response.status < 400 &&
                     (Object.keys(cookies).length > 0 || responseUrl !== loginUrl.toLowerCase());
    
    if (isSuccess && Object.keys(cookies).length > 0) {
      // Find session cookie
      const sessionCookieName = config.sessionCookieName || 
        Object.keys(cookies).find(key => 
          key.toLowerCase().includes('session') || 
          key.toLowerCase().includes('auth') ||
          key.toLowerCase().includes('token')
        ) || Object.keys(cookies)[0];
      
      return {
        success: true,
        sessionCookie: cookies[sessionCookieName],
        cookies
      };
    } else {
      // Provide specific error message
      let errorMessage = 'Login failed';
      
      if (hasInvalidCredentials) {
        errorMessage = 'Invalid credentials - check email and password';
      } else if (hasCaptcha) {
        errorMessage = 'CAPTCHA required - manual login needed';
      } else if (hasAccountLocked) {
        errorMessage = 'Account locked or blocked - check account status';
      } else if (hasTwoFactor) {
        errorMessage = 'Two-factor authentication required - not supported';
      } else if (response.status === 401 || response.status === 403) {
        errorMessage = `Authentication failed (HTTP ${response.status}) - check credentials`;
      } else if (Object.keys(cookies).length === 0) {
        errorMessage = 'No session cookie received - login form may have changed';
      } else {
        errorMessage = 'Login failed - unknown error (check form structure)';
      }
      
      return {
        success: false,
        error: errorMessage,
        cookies
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Login error: ${error.message}`
    };
  }
}

/**
 * Fetch HTML with authentication (if login config provided)
 * Uses session cache to avoid re-logging in for every request
 */
export async function fetchHtmlWithAuth(
  url: string,
  loginConfig?: LoginConfig,
  institutionId?: string
): Promise<{ html: string; status: number; cookies?: Record<string, string> }> {
  if (!loginConfig) {
    // No auth needed, use regular fetch
    const result = await fetchHtml(url);
    return {
      html: result.html,
      status: result.status
    };
  }
  
  // Check for cached session first
  let cookies: Record<string, string> | null = null;
  if (institutionId) {
    const { getCachedSession } = await import('./session-cache');
    cookies = getCachedSession(institutionId);
  }
  
  // If no cached session, login
  if (!cookies) {
    const loginResult = await loginToSite(loginConfig);
    
    if (!loginResult.success || !loginResult.cookies) {
      throw new Error(`Authentication failed: ${loginResult.error}`);
    }
    
    cookies = loginResult.cookies;
    
    // Cache the session
    if (institutionId) {
      const { cacheSession } = await import('./session-cache');
      cacheSession(institutionId, cookies, 60); // Cache for 1 hour
    }
  }
  
  // Fetch page with cookies
  const cookieString = Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
  
  const response = await fetch(url, {
    headers: {
      'Cookie': cookieString,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  
  // If we get 401/403, session might be expired - clear cache and retry
  if (response.status === 401 || response.status === 403) {
    if (institutionId) {
      const { clearSession } = await import('./session-cache');
      clearSession(institutionId);
      
      // Retry login
      const loginResult = await loginToSite(loginConfig);
      if (loginResult.success && loginResult.cookies) {
        cookies = loginResult.cookies;
        if (institutionId) {
          const { cacheSession } = await import('./session-cache');
          cacheSession(institutionId, cookies, 60);
        }
        
        // Retry fetch
        const cookieString2 = Object.entries(cookies)
          .map(([name, value]) => `${name}=${value}`)
          .join('; ');
        const response2 = await fetch(url, {
          headers: {
            'Cookie': cookieString2,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        const html2 = await response2.text();
        return {
          html: html2,
          status: response2.status,
          cookies
        };
      }
    }
  }
  
  const html = await response.text();
  
  return {
    html,
    status: response.status,
    cookies
  };
}

