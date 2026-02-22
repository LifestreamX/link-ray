# LinkRay - AI Link Analyzer

Modern web app to analyze, summarize, and score website links for safety using AI.

## Tech Stack

- **Database**: CockroachDB (PostgreSQL-compatible)
- **ORM**: Prisma
- **Auth**: NextAuth.js with Google OAuth
- **AI**: Google Gemini
- **Framework**: Next.js 16
- **Language**: TypeScript

## Quick Start

1. **Clone & install:**
   ```bash
   git clone https://github.com/LifestreamX/link-ray.git
   cd linkray-app
   npm install
   ```

2. **Set up CockroachDB:**
   - Create a free account at [cockroachlabs.cloud](https://cockroachlabs.cloud)
   - Create a new cluster and database named `linkray`
   - Copy your connection string

3. **Set up Google OAuth:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials (Web application)
   - Add `http://localhost:3000` to authorized origins
   - Add `http://localhost:3000/api/auth/callback/google` to authorized redirect URIs
   - Copy your Client ID and Client Secret

4. **Get Google Gemini API key:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create and copy your API key

5. **Configure environment:**
   - Copy `.env.example` to `.env`
   - Fill in all required values (see below)

6. **Run database migrations:**
   ```bash
   npx prisma migrate dev
   ```

7. **Start the app:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

```bash
# CockroachDB
COCKROACHDB_URL=your_cockroachdb_connection_string

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_string
```

Generate a secret for `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

