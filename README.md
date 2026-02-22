# LinkRay - AI Link Analyzer

Modern web app to analyze, summarize, and score website links for safety.

## Quick Start

1. Clone & install:
   ```
   git clone https://github.com/yourname/linkray-app.git
   cd linkray-app
   npm install
   ```
2. Set up Supabase:
   - Create a project at supabase.com
   - Run `supabase-schema.sql` and migrations in SQL Editor
   - Get your Project URL and anon key
3. Get Google Gemini API key:
   - Go to Google AI Studio, create and copy your API key
4. Configure environment:
   - Copy `.env.example` to `.env` and fill in your keys
5. Run the app:
   ```
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

