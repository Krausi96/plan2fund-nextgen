# Non-Visual Testing Guide for UI Improvements

This guide provides practical, automated, and systematic testing methods beyond visual inspection.

---

## 1. Functional Testing (Automated & Manual)

### 1.1 Build & Runtime Checks

```bash
# Check if the app builds successfully
npm run build

# Check for TypeScript errors (already passing ✅)
npm run typecheck

# Check for linting errors
npm run lint

# Full validation (TypeScript + Linting)
npm run validate
```

### 1.2 Automated Component Testing

**Check if components render without errors:**

```bash
# Run existing tests (if any)
npm run test

# Check test coverage
npm run coverage
```

**Manual functional checklist (create a test script):**

1. **Navigation Testing:**
   - [ ] All header links work (How It Works, Pricing, FAQ)
   - [ ] Footer links work (Contact, Privacy, Terms)
   - [ ] Breadcrumbs are clickable (completed steps)
   - [ ] Mobile menu opens/closes correctly

2. **Form Testing:**
   - [ ] Login modal accepts valid email/password
   - [ ] Checkout form validates inputs
   - [ ] Editor saves content
   - [ ] All inputs have proper labels (accessibility)

3. **PageEntryIndicator Testing:**
   - [ ] Auto-dismisses after 5 seconds
   - [ ] Manual dismiss (X button) works
   - [ ] Doesn't block page interactions
   - [ ] Appears on all 8 pages

4. **State Management:**
   - [ ] User authentication persists
   - [ ] Form data persists on navigation
   - [ ] Dashboard loads user data correctly

---

## 2. Responsive Testing (Automated Tools)

### 2.1 Browser DevTools (Built-in)

**Chrome/Edge DevTools:**
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test these breakpoints:
   - Mobile: 375px, 414px
   - Tablet: 768px, 1024px
   - Desktop: 1280px, 1920px

**Test checklist:**
- [ ] Header menu converts to hamburger on mobile
- [ ] Cards stack vertically on mobile
- [ ] PageEntryIndicator doesn't overflow on small screens
- [ ] Buttons are tap-friendly (min 44x44px)
- [ ] Text is readable without zooming

### 2.2 Automated Responsive Testing

**Using Puppeteer (already in dependencies):**

Create `scripts/test-responsive.mjs`:

```javascript
import puppeteer from 'puppeteer';

const viewports = [
  { width: 375, height: 667, name: 'iPhone SE' },
  { width: 768, height: 1024, name: 'iPad' },
  { width: 1920, height: 1080, name: 'Desktop' }
];

const pages = [
  '/',
  '/reco',
  '/dashboard',
  '/pricing',
  '/checkout'
];

async function testResponsive() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  for (const viewport of viewports) {
    await page.setViewport(viewport);
    console.log(`Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
    
    for (const url of pages) {
      await page.goto(`http://localhost:3000${url}`);
      await page.waitForSelector('body');
      
      // Check for layout issues
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      
      if (hasHorizontalScroll) {
        console.error(`❌ Horizontal scroll detected on ${url} at ${viewport.name}`);
      } else {
        console.log(`✅ No horizontal scroll on ${url} at ${viewport.name}`);
      }
    }
  }
  
  await browser.close();
}

testResponsive();
```

**Run it:**
```bash
# Start dev server first
npm run dev

# In another terminal
node scripts/test-responsive.mjs
```

---

## 3. Accessibility Testing (Automated Tools)

### 3.1 Lighthouse (Built into Chrome)

**Automated accessibility audit:**

1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "Accessibility" checkbox
4. Click "Analyze page load"
5. Test these pages:
   - `/` (Landing)
   - `/reco`
   - `/dashboard`
   - `/checkout`
   - `/login` (modal)

**Target scores:**
- Accessibility: 90+ (aim for 100)
- Check for:
  - Color contrast ratios (WCAG AA: 4.5:1 for text)
  - Form labels
  - ARIA attributes
  - Keyboard navigation

### 3.2 axe DevTools (Browser Extension)

**Install:**
- Chrome: [axe DevTools Extension](https://chrome.google.com/webstore/detail/axe-devtools)
- Firefox: [axe DevTools Extension](https://addons.mozilla.org/firefox/addon/axe-devtools/)

**Usage:**
1. Install extension
2. Open your page
3. Open DevTools → "axe DevTools" tab
4. Click "Scan" → Review violations

### 3.3 Keyboard Navigation Testing (Manual)

**Test with keyboard only (no mouse):**

1. **Tab Navigation:**
   - [ ] Tab through all interactive elements
   - [ ] Focus indicators are visible (blue outline)
   - [ ] Tab order is logical
   - [ ] Can reach all buttons/links

2. **Keyboard Shortcuts:**
   - [ ] Enter/Space activates buttons
   - [ ] Escape closes modals
   - [ ] Arrow keys navigate dropdowns

3. **Skip Links:**
   - [ ] "Skip to main content" link works (in Header)

**Test script:**
```bash
# Create a checklist file
cat > test-keyboard.md << 'EOF'
# Keyboard Navigation Test

1. Open page
2. Press Tab repeatedly
3. Document focus order
4. Check if all interactive elements are reachable
5. Test Enter/Space on buttons
6. Test Escape on modals
EOF
```

### 3.4 Screen Reader Testing

**Using NVDA (Windows - Free):**
1. Download: https://www.nvaccess.org/
2. Install and start NVDA
3. Navigate pages with arrow keys
4. Check if:
   - Page titles are announced
   - Links are described clearly
   - Form labels are read
   - PageEntryIndicator is announced (aria-live)

**Using VoiceOver (Mac - Built-in):**
1. Enable: System Preferences → Accessibility → VoiceOver
2. Press Cmd+F5 to toggle
3. Navigate with VO+Arrow keys

---

## 4. Browser Compatibility Testing

### 4.1 Automated Cross-Browser Testing

**Using BrowserStack (Cloud - Paid):**
- Sign up: https://www.browserstack.com/
- Test on: Chrome, Firefox, Safari, Edge
- Test on: iOS Safari, Chrome Android

**Using Playwright (Free - Add to project):**

```bash
# Install Playwright
npm install -D @playwright/test

# Create playwright.config.ts
```

**Create `playwright.config.ts`:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Create `tests/browser-compat.spec.ts`:**
```typescript
import { test, expect } from '@playwright/test';

const pages = ['/', '/reco', '/dashboard', '/pricing'];

pages.forEach(page => {
  test(`${page} loads in all browsers`, async ({ page: browserPage }) => {
    await browserPage.goto(`http://localhost:3000${page}`);
    await expect(browserPage.locator('body')).toBeVisible();
  });
});
```

**Run:**
```bash
npx playwright test
```

### 4.2 Manual Browser Testing Checklist

**Test in each browser:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (Mac/iOS)
- [ ] Edge (latest)

**Check for:**
- [ ] Pages load without errors
- [ ] Colors render correctly
- [ ] Animations work (PageEntryIndicator pulse)
- [ ] Forms submit correctly
- [ ] No console errors

---

## 5. Performance Testing

### 5.1 Lighthouse Performance Audit

**Run Lighthouse:**
1. Chrome DevTools → Lighthouse
2. Select "Performance" checkbox
3. Click "Analyze"

**Target metrics:**
- First Contentful Paint: < 1.8s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.8s
- Cumulative Layout Shift: < 0.1

### 5.2 Bundle Size Analysis

```bash
# Analyze bundle size
npm run analyze:bundle

# Check for unused code
npm run analyze:unused

# Full analysis
npm run analyze:all
```

---

## 6. Automated Testing Scripts

### 6.1 Create Test Script

**Create `scripts/test-ui-improvements.mjs`:**

```javascript
import { execSync } from 'child_process';

console.log('🧪 Testing UI Improvements...\n');

// 1. TypeScript check
console.log('1. TypeScript Check...');
try {
  execSync('npm run typecheck', { stdio: 'inherit' });
  console.log('✅ TypeScript: PASSED\n');
} catch (error) {
  console.error('❌ TypeScript: FAILED\n');
  process.exit(1);
}

// 2. Linting
console.log('2. Linting Check...');
try {
  execSync('npm run lint', { stdio: 'inherit' });
  console.log('✅ Linting: PASSED\n');
} catch (error) {
  console.error('❌ Linting: FAILED\n');
  process.exit(1);
}

// 3. Build check
console.log('3. Build Check...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build: PASSED\n');
} catch (error) {
  console.error('❌ Build: FAILED\n');
  process.exit(1);
}

console.log('🎉 All automated checks passed!');
console.log('\nNext steps:');
console.log('1. Run manual functional tests');
console.log('2. Test responsive design in DevTools');
console.log('3. Run Lighthouse accessibility audit');
console.log('4. Test keyboard navigation');
```

**Add to package.json:**
```json
"test:ui": "node scripts/test-ui-improvements.mjs"
```

**Run:**
```bash
npm run test:ui
```

---

## 7. Quick Testing Checklist

### Automated (Run these commands):

```bash
# ✅ TypeScript (already passing)
npm run typecheck

# ✅ Linting
npm run lint

# ✅ Build
npm run build

# ✅ Full validation
npm run validate
```

### Manual (Use these tools):

1. **Lighthouse** (Chrome DevTools)
   - Accessibility audit
   - Performance audit

2. **axe DevTools** (Browser Extension)
   - Automated accessibility scanning

3. **DevTools Responsive Mode**
   - Test mobile/tablet/desktop

4. **Keyboard Navigation**
   - Tab through all pages
   - Test Enter/Space/Escape

5. **Screen Reader** (NVDA/VoiceOver)
   - Navigate with keyboard
   - Check announcements

---

## 8. Testing Report Template

Create `redesign/UI/TEST_RESULTS.md`:

```markdown
# UI Improvements Test Results

**Date:** [Date]
**Tester:** [Name]

## Automated Tests
- [ ] TypeScript: PASS/FAIL
- [ ] Linting: PASS/FAIL
- [ ] Build: PASS/FAIL

## Functional Tests
- [ ] Navigation works
- [ ] Forms submit
- [ ] PageEntryIndicator works
- [ ] All pages load

## Responsive Tests
- [ ] Mobile (375px): PASS/FAIL
- [ ] Tablet (768px): PASS/FAIL
- [ ] Desktop (1920px): PASS/FAIL

## Accessibility Tests
- [ ] Lighthouse Score: [Score]
- [ ] Keyboard navigation: PASS/FAIL
- [ ] Screen reader: PASS/FAIL

## Browser Compatibility
- [ ] Chrome: PASS/FAIL
- [ ] Firefox: PASS/FAIL
- [ ] Safari: PASS/FAIL
- [ ] Edge: PASS/FAIL

## Issues Found
[List any issues]

## Notes
[Additional notes]
```

---

## Summary

**Quick Start:**
1. Run automated checks: `npm run validate && npm run build`
2. Open Lighthouse in Chrome DevTools
3. Test responsive in DevTools (Ctrl+Shift+M)
4. Install axe DevTools extension
5. Test keyboard navigation (Tab through pages)

**Most Important:**
- ✅ TypeScript check (already passing)
- ✅ Build check (ensures no runtime errors)
- ✅ Lighthouse accessibility (catches most a11y issues)
- ✅ Responsive DevTools (catches layout issues)


