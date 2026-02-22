# 🚀 LinkRay Setup Guide

## Step-by-Step Setup Instructions

Follow these steps to get LinkRay running on your machine. Everything here is **100% FREE** - no credit card required!

---

## ✅ Step 1: Install Dependencies (Already Done!)

Dependencies have been installed. You should see a `node_modules` folder in your project.

---

## 🗄️ Step 2: Set Up Supabase Database

### 2.1 Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" (it's free!)
3. Sign in with GitHub or create an account

### 2.2 Create a New Project

1. Click "New Project"
2. Fill in:
   - **Name**: LinkRay (or whatever you want)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
3. Click "Create new project"
4. Wait 2-3 minutes for setup to complete

### 2.3 Run the Database Schema

1. In your Supabase dashboard, click on "SQL Editor" in the left sidebar
2. Click "New query"
3. Open the file `supabase-schema.sql` in your project
4. Copy ALL the content
5. Paste it into the SQL Editor
6. Click "Run" or press `Ctrl+Enter`
7. You should see "Success. No rows returned"

### 2.4 Get Your API Keys

1. Click on the "Settings" icon in the sidebar (gear icon)
2. Click "API"
3. You'll see:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)
4. Keep this tab open - you'll need these values!

---

## 🤖 Step 3: Get Google Gemini API Key

### 3.1 Create API Key

1. Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Select "Create API key in new project" or use existing project
5. Copy the generated key (starts with `AIza...`)

**Important**: Keep this key secret! Don't commit it to GitHub.

---

## 🔑 Step 4: Configure Environment Variables

3. Try analyzing a URL like:
   - `https://github.com`
   - `https://wikipedia.org`
   - `https://example.com`

---

## 🐛 Troubleshooting

### "Missing Supabase environment variables"

- Make sure you created the `.env` file
- Check that variable names match exactly (case-sensitive)
- Restart the dev server after editing `.env`

### "Failed to fetch website" or Timeout Errors

- Some websites block scrapers
- Try a different URL
- Check your internet connection

### Database Errors

- Make sure you ran the SQL schema in Supabase
- Check that your Supabase project is active
- Verify Row Level Security policies are created

### AI Analysis Errors

- Verify your Gemini API key is correct
- Check if you've hit the free tier limit (unlikely - it's generous)
- Try again in a few seconds

### Port 3000 Already in Use

Run on a different port:

```bash
npm run dev -- -p 3001
```

---

## 📊 Verify Database Setup

To check if your database is working:

1. Go to Supabase dashboard
2. Click "Table Editor" in sidebar
3. You should see a `scans` table
4. After analyzing a URL in LinkRay, refresh the table - you should see a new row!

---

## 🚀 Deploy to Production (Optional)

### Deploy to Vercel (Free)

1. Push your code to GitHub (don't include `.env`!)
2. Go to [https://vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
6. Click "Deploy"
7. Done! Your app is live 🎉

---

## 📋 Checklist

- [ ] Supabase account created
- [ ] Database schema executed
- [ ] Supabase URL and key copied
- [ ] Gemini API key obtained
- [ ] `.env` file updated with all keys
- [ ] `npm install` completed
- [ ] `npm run dev` running
- [ ] App loads at localhost:3000
- [ ] Successfully analyzed a test URL

---

## 💰 Cost Breakdown (It's FREE!)

| Service       | Free Tier Limits                            | Enough For          |
| ------------- | ------------------------------------------- | ------------------- |
| **Supabase**  | 500MB database, 50,000 monthly active users | Thousands of scans  |
| **Gemini AI** | 60 requests/minute                          | 3,600 scans/hour    |
| **Microlink** | 100 requests/day                            | 100 screenshots/day |
| **Vercel**    | 100GB bandwidth, serverless functions       | Production hosting  |

**Total Cost: $0.00/month** 🎉

---

## 🆘 Need Help?

- Check the main `README.md` for architecture details
- Review the code comments in `app/api/analyze/route.ts`
- Make sure all environment variables are set correctly
- Restart the dev server after any config changes

---

**You're all set!** Happy scanning! 🔍✨
