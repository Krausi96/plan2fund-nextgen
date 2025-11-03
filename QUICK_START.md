# 🚀 Quick Start Guide - Running Plan2Fund

## 📱 What This Is

**Plan2Fund** is a **web application** (not a downloadable app). It runs in your browser at `http://localhost:3000`.

---

## ✅ Prerequisites

1. **Node.js** (version 20.x)
   - Download: https://nodejs.org/
   - Verify: `node --version` (should show v20.x.x)

2. **npm** (comes with Node.js)
   - Verify: `npm --version`

3. **Database Connection** (optional, but recommended)
   - Set `DATABASE_URL` in `.env.local` for database features
   - Otherwise uses JSON fallback

---

## 🏃 Running the Application

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Start Development Server

```bash
npm run dev
```

### Step 3: Open in Browser

The application will start at:
```
http://localhost:3000
```

**That's it!** The app is now running and accessible in your browser.

---

## 🌐 Deployment (If Deployed)

If this application is deployed to Vercel or another hosting service:

1. **Check for deployment URL** in:
   - GitHub repository settings
   - Vercel dashboard (if using Vercel)
   - Environment variables (`.env.local` might have `NEXT_PUBLIC_BASE_URL`)

2. **Access deployed version:**
   - URL will be something like: `https://your-app.vercel.app`

---

## 📱 Mobile Access

Since this is a **web application**, you can access it on mobile by:

1. **Same WiFi network:**
   - Find your computer's local IP (e.g., `192.168.1.100`)
   - On mobile browser, go to: `http://192.168.1.100:3000`

2. **Deployed version:**
   - If deployed, just open the URL on your mobile browser

3. **Desktop browser:**
   - The app works best in Chrome, Firefox, Safari, or Edge

---

## 🔧 Available Scripts

```bash
# Development (with hot reload)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type checking
npm run typecheck

# Linting
npm run lint
```

---

## ❓ Troubleshooting

### Port 3000 already in use?

Change the port:
```bash
PORT=3001 npm run dev
```

Then access at: `http://localhost:3001`

### Database connection errors?

1. Check `.env.local` has `DATABASE_URL` set
2. Or the app will use JSON fallback (still works!)

### Dependencies not installing?

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 Notes

- **This is NOT a mobile app** - it's a web application that runs in browsers
- **Cursor IDE** - Only available as desktop app (Windows/Mac/Linux), no mobile version
- **For mobile access** - Use your mobile browser to access the web app URL

---

## 🆘 Need Help?

- Check `README.md` for detailed documentation
- Check `docs/` folder for architecture and implementation guides
- API endpoints are at `/api/*` (e.g., `/api/programs`)

