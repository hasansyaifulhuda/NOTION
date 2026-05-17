# DevVault

> Developer Knowledge Workspace & Documentation Vault

A premium, modular, production-ready documentation platform built with pure HTML, CSS, and Vanilla JavaScript — designed for developers who value clarity, speed, and elegance.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Setup Guide](#setup-guide)
- [Supabase Setup](#supabase-setup)
- [SQL Setup](#sql-setup)
- [Admin Account Setup](#admin-account-setup)
- [Deployment](#deployment)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Responsive Behavior](#responsive-behavior)
- [Auth System](#auth-system)
- [Security Notes](#security-notes)
- [Troubleshooting](#troubleshooting)

---

## Overview

DevVault is a developer-centric documentation platform that combines the best of:
- **Notion** – flexible page & block system
- **VS Code** – developer aesthetic and code tooling
- **GitBook** – clean documentation layout
- **Linear** – precision-crafted UI

It supports two modes:
- **Guest Mode** – read-only access to public documentation
- **Admin Mode** – full CRUD access to all content

---

## Features

### Core
- **Documentation Pages** – long-scroll docs layout with breadcrumbs, reading progress, and TOC
- **Block System** – heading, text, code, quote, link, checklist, snippet embed
- **Category System** – organize pages with color-coded, icon-based categories
- **Snippet Management** – code snippet vault with syntax highlighting
- **Full-text Search** – search within pages with keyword highlighting
- **Command Palette** – Ctrl+K fast navigation
- **Multi-tab System** – open multiple pages in tabs
- **Trash & Restore** – soft delete with restore support
- **JSON Export** – export pages and backups as JSON

### Developer Experience
- Prism.js syntax highlighting (JS, CSS, HTML, SQL, JSON, Bash, Python)
- Code block copy, collapse, and fullscreen modes
- Line numbers in code blocks
- Reading time estimation
- Reading progress bar
- Reading mode (distraction-free)

### UI/UX
- Dark mode by default, light mode available
- Fully responsive (desktop, tablet, mobile)
- Mobile drawer sidebar + bottom navigation
- Toast notifications
- Admin notification center
- Lucide Icons throughout

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Icons | Lucide Icons |
| Syntax | Prism.js |
| Fonts | Inter, JetBrains Mono |
| Hosting | Vercel / Netlify / GitHub Pages |

---

## Folder Structure

```
devvault/
│
├── index.html          # Application shell
├── README.md           # This file
├── shortcut.txt        # Keyboard shortcuts reference
├── sql-editor.txt      # Supabase SQL schema & setup
├── supabase.js         # Supabase client configuration
│
├── assets/
│   ├── icons/          # Custom icon assets
│   ├── images/         # Static images
│   └── favicon/        # Favicon files
│
├── css/
│   ├── style.css       # Core styles & components
│   ├── themes.css      # Dark/light theme system
│   ├── responsive.css  # Responsive layout rules
│   └── code-theme.css  # Prism.js code highlighting
│
├── js/
│   ├── app.js          # App bootstrap & initialization
│   ├── auth.js         # Authentication system
│   ├── router.js       # SPA hash routing + tab system
│   ├── sidebar.js      # Sidebar navigation
│   ├── pages.js        # Pages & categories CRUD
│   ├── blocks.js       # Block system
│   ├── snippets.js     # Snippets CRUD
│   ├── search.js       # In-page search system
│   ├── toc.js          # Table of contents + reading progress
│   ├── shortcuts.js    # Keyboard shortcuts + command palette
│   ├── settings.js     # Settings page + theme system
│   ├── notifications.js # Toast + notification center
│   ├── export-json.js  # JSON export system
│   ├── supabase-api.js # Supabase API layer + demo data
│   └── utils.js        # Utility functions
│
└── libs/
    ├── prism/          # Prism.js (loaded via CDN)
    └── lucide/         # Lucide Icons (loaded via CDN)
```

---

## Setup Guide

### Option A: Demo Mode (No Supabase)

1. Clone or download the project
2. Open `index.html` in your browser (or serve with a local HTTP server)
3. The app runs in demo mode with local storage — no database required

```bash
# Simple local server (Python)
cd devvault
python3 -m http.server 8080

# Or with Node.js
npx serve .
```

### Option B: Full Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Follow the [Supabase Setup](#supabase-setup) section below
3. Run the SQL schema from `sql-editor.txt`
4. Create your admin account
5. Configure `supabase.js`
6. Deploy to Vercel/Netlify

---

## Supabase Setup

### 1. Create Project
1. Go to [supabase.com](https://supabase.com)
2. Click **New Project**
3. Choose a name, database password, and region
4. Wait for project to initialize (~2 minutes)

### 2. Get API Credentials
1. Go to **Project Settings** → **API**
2. Copy your **Project URL** (looks like `https://xxxx.supabase.co`)
3. Copy your **anon/public** key (NOT the service_role key)

### 3. Configure supabase.js
Open `supabase.js` and replace the placeholders:

```javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

**⚠️ IMPORTANT:** Never use your `service_role` key in frontend code.

---

## SQL Setup

1. In Supabase Dashboard, go to **SQL Editor**
2. Open `sql-editor.txt` from this project
3. Copy the entire SQL content
4. Paste into Supabase SQL Editor
5. Click **Run**

The SQL script will:
- Create all required tables with proper columns
- Set up indexes for performance
- Configure Row Level Security (RLS) policies
- Create triggers for `updated_at` timestamps
- Insert seed data for testing

---

## Admin Account Setup

### Creating Your Admin Account

**Admin credentials for setup:**
- Email: `hasansyaifulhuda24@gmail.com`
- Password: `shanz`

**Steps:**

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Click **Add User** → **Create new user**
4. Enter:
   - Email: `hasansyaifulhuda24@gmail.com`
   - Password: `shanz`
   - ✅ Check "Auto Confirm User"
5. Click **Create User**

### Logging In

1. Open your DevVault application
2. Click **Login** button (top-right) or press `Ctrl+K` and type "Login"
3. Enter your admin credentials
4. You now have full admin access

### Guest vs Admin Access

| Feature | Guest | Admin |
|---------|-------|-------|
| Browse public pages | ✅ | ✅ |
| Read documentation | ✅ | ✅ |
| Copy public snippets | ✅ | ✅ |
| Search content | ✅ | ✅ |
| Create/edit pages | ❌ | ✅ |
| Manage categories | ❌ | ✅ |
| Manage snippets | ❌ | ✅ |
| Delete/restore content | ❌ | ✅ |
| Export backups | ❌ | ✅ |
| View private pages | ❌ | ✅ |
| Access trash | ❌ | ✅ |
| Admin notifications | ❌ | ✅ |

---

## Deployment

### Vercel (Recommended)

1. Push your project to a GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Click **New Project** → Import your GitHub repo
4. No build configuration needed (static files)
5. Click **Deploy**
6. Your app is live!

### Netlify

1. Drag & drop your `devvault/` folder to [netlify.com/drop](https://app.netlify.com/drop)
2. Or connect your GitHub repo via Netlify dashboard
3. No build configuration needed

### GitHub Pages

1. Push to a GitHub repository
2. Go to **Settings** → **Pages**
3. Set source to `main` branch, `/ (root)` folder
4. Your app is live at `https://username.github.io/repo-name`

**Note:** For GitHub Pages, ensure `index.html` is at the root of your repository or properly referenced.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Open Command Palette |
| `Ctrl+F` | Open Search |
| `Ctrl+B` | Toggle Sidebar |
| `Ctrl+Shift+D` | Go to Dashboard |
| `Ctrl+Shift+C` | Go to Categories |
| `Ctrl+Shift+T` | Go to Trash (Admin) |
| `Ctrl+Shift+H` | Go to Settings/Shortcuts |
| `Ctrl+Shift+Q` | Toggle Reading Mode |
| `Ctrl+Shift+L` | Toggle Theme |
| `Esc` | Close modals / command palette |

---

## Responsive Behavior

### Desktop (>1024px)
- Full sidebar (fixed width 260px)
- Center content area
- Right TOC panel (240px)
- Full tab bar visible

### Tablet (768px – 1024px)
- Collapsible sidebar (drawer mode)
- No TOC panel
- Tab bar visible

### Mobile (<768px)
- Slide-out sidebar drawer
- Mobile bottom navigation bar
- Fullscreen search modal
- Optimized touch targets
- Code blocks with horizontal scroll
- Simplified toolbar

---

## Auth System

DevVault uses **Supabase Auth** with email/password login.

- Sessions persist across browser refreshes using Supabase's built-in session management
- Auth tokens are stored securely in localStorage via Supabase SDK
- Token auto-refresh is enabled
- Unauthorized access attempts are redirected to the login modal
- Admin-only UI elements are hidden for guest users

---

## Security Notes

1. **Never expose `service_role` key** in frontend code
2. **RLS (Row Level Security)** is enabled on all tables
3. Private pages are protected at the database query level
4. Admin actions are validated client-side AND protected by RLS server-side
5. All user input is sanitized before DOM insertion
6. External links use `rel="noopener noreferrer"`

---

## Troubleshooting

### App shows blank screen
- Check browser console for JavaScript errors
- Ensure all JS/CSS files are properly loaded
- Try clearing browser cache

### Supabase connection fails
- Verify `SUPABASE_URL` starts with `https://`
- Verify `SUPABASE_ANON_KEY` is correct (not service_role key)
- Check Supabase project is active
- Verify RLS policies allow read access

### Login fails
- Ensure admin user exists in Supabase Authentication → Users
- Check user is confirmed (check "Auto Confirm" during creation)
- Verify credentials match exactly

### Pages not loading
- Run SQL schema from `sql-editor.txt`
- Check Supabase RLS policies allow select for anon users on published pages
- Check browser console for API errors

### Demo mode issues
- Clear `devvault_demo_data` from localStorage to reset demo data
- Demo data is stored in browser localStorage

---

## License

MIT License — Free to use, modify, and distribute.

---

*Built with ❤️ for developers who care about their tools.*
