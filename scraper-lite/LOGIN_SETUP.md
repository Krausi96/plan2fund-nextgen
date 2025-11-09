# Login/Authentication Setup Guide

## Overview

Some funding program websites require login/authentication to access content. The scraper can automatically handle login for these sites.

## How It Works

1. **Detection**: The scraper detects when a page requires login (checks for login forms, authentication messages)
2. **Configuration**: If login is configured for that institution, it attempts to authenticate
3. **Authentication**: Uses provided credentials to log in and fetch protected content
4. **Fallback**: If login fails or isn't configured, the URL is marked as failed and blacklisted

## Setup Instructions

### Option 1: Environment Variables (Recommended)

Set environment variables for each institution:

```bash
# Format: {INSTITUTION_ID}_EMAIL and {INSTITUTION_ID}_PASSWORD
# Example for AWS:
AWS_EMAIL=your-email@example.com
AWS_PASSWORD=your-password

# Example for FFG:
FFG_EMAIL=your-email@example.com
FFG_PASSWORD=your-password
```

### Option 2: Institution Config

Add `loginConfig` to the institution in `src/config/institutionConfig.ts`:

```typescript
{
  id: 'institution_aws',
  name: 'AWS',
  baseUrl: 'https://aws.at',
  // ... other config ...
  loginConfig: {
    enabled: true,
    loginUrl: 'https://aws.at/login',
    email: 'your-email@example.com', // Or leave empty to use env var
    password: 'your-password', // Or leave empty to use env var
    emailFieldSelector: 'input[name="email"]', // Optional: custom selectors
    passwordFieldSelector: 'input[name="password"]',
    submitButtonSelector: 'button[type="submit"]',
    sessionCookieName: 'session_id' // Optional: custom cookie name
  }
}
```

### Option 3: Hybrid (Recommended)

Use institution config with env vars for credentials (more secure):

```typescript
{
  id: 'institution_aws',
  // ... other config ...
  loginConfig: {
    enabled: true,
    loginUrl: 'https://aws.at/login',
    // Credentials from env vars: AWS_EMAIL and AWS_PASSWORD
    email: process.env.AWS_EMAIL || '',
    password: process.env.AWS_PASSWORD || '',
  }
}
```

## Current Implementation

The login system:
- ✅ Detects login-required pages automatically
- ✅ Attempts login if credentials are configured
- ✅ Uses cookies for authenticated requests
- ✅ Falls back gracefully if login fails
- ⚠️  Basic implementation (may not work for all sites)

## Limitations

The current login implementation is basic and may not work for sites that require:
- Multi-step authentication
- CAPTCHA solving
- OAuth/SAML
- Complex CSRF token handling
- JavaScript-based authentication

For these cases, you may need to:
1. Manually log in and export cookies
2. Use browser automation (Puppeteer/Playwright)
3. Use API access if available

## Testing Login

To test if login works for an institution:

1. Add login config to `institutionConfig.ts`
2. Set environment variables
3. Run scraper: `npm run scraper:unified -- scrape --max=1`
4. Check logs for: `✅ Login successful - fetching with authentication...`

## Security Notes

⚠️ **IMPORTANT**: Never commit credentials to git!

- Use environment variables (`.env.local` - already in `.gitignore`)
- Use secret management services in production
- Rotate credentials regularly
- Use read-only accounts when possible

## Troubleshooting

**Login fails with "No login credentials configured"**
- Check that `loginConfig.enabled = true`
- Verify environment variables are set
- Check institution ID matches env var prefix

**Login fails with "Login failed"**
- Verify credentials are correct
- Check if site requires additional steps (2FA, CAPTCHA)
- Inspect login form selectors (may need customization)
- Check browser network tab for actual login flow

**Login succeeds but content still requires login**
- Session cookie may not be persisting
- May need to handle redirects differently
- Check if site uses different authentication mechanism

