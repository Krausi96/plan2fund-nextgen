/**
 * Login/Authentication Utilities
 * Handles manual login for sites that require authentication
 * 
 * SECURITY NOTE: Credentials should be stored securely (encrypted, environment variables)
 */

import { fetchHtml } from './utils';
import * as cheerio from 'cheerio';

export interface LoginConfig {
  url: string;
  email: string;
  password: string; // Should be encrypted in production
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
    // Fetch login page
    const loginPage = await fetchHtml(config.url);
    
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
    const submitSelector = config.submitButtonSelector || 'button[type="submit"], input[type="submit"]';
    
    const emailField = form.find(emailSelector).first();
    const passwordField = form.find(passwordSelector).first();
    const submitButton = form.find(submitSelector).first();
    
    if (emailField.length === 0 || passwordField.length === 0) {
      return {
        success: false,
        error: 'Email or password field not found'
      };
    }
    
    // Get form action URL
    const formAction = form.attr('action') || config.url;
    const formMethod = form.attr('method') || 'POST';
    const actionUrl = formAction.startsWith('http') 
      ? formAction 
      : new URL(formAction, config.url).toString();
    
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
        'Referer': config.url,
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
    
    // Check if login was successful (basic check)
    const responseText = await response.text();
    const isSuccess = !responseText.toLowerCase().includes('invalid') &&
                     !responseText.toLowerCase().includes('error') &&
                     !responseText.toLowerCase().includes('failed');
    
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
      return {
        success: false,
        error: 'Login failed - invalid credentials or form submission error',
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
 */
export async function fetchHtmlWithAuth(
  url: string,
  loginConfig?: LoginConfig
): Promise<{ html: string; status: number; cookies?: Record<string, string> }> {
  if (!loginConfig) {
    // No auth needed, use regular fetch
    const result = await fetchHtml(url);
    return {
      html: result.html,
      status: result.status
    };
  }
  
  // Try to login first
  const loginResult = await loginToSite(loginConfig);
  
  if (!loginResult.success || !loginResult.cookies) {
    throw new Error(`Authentication failed: ${loginResult.error}`);
  }
  
  // Fetch page with cookies
  const cookieString = Object.entries(loginResult.cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
  
  const response = await fetch(url, {
    headers: {
      'Cookie': cookieString,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  
  const html = await response.text();
  
  return {
    html,
    status: response.status,
    cookies: loginResult.cookies
  };
}

