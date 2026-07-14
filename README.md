## Repository Status

This repository is actively maintained.

# Music Recommender - AI-Powered Spotify Recommendations

A full-stack web application that provides personalized music recommendations using AI (Google Gemini), integrated with Spotify OAuth authentication. Users can discover their top tracks, top artists, and get AI-powered song recommendations tailored to their listening habits.

## Features

- **Spotify OAuth Authentication**: Secure login with Spotify account
- **Top Tracks**: View and explore your most played songs on Spotify
- **Top Artists**: Discover your most followed artists
- **AI Recommendations**: Get personalized track recommendations powered by Google Gemini
- **Smart Caching**: Session-based caching for optimal performance
- **Dark/Light Mode**: Toggle between dark and light themes with persistent settings
- **Responsive Design**: Beautiful UI that works on all devices
- **Real-time Updates**: Fresh recommendations generated on demand

## Architecture

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Caching**: sessionStorage (5 min for tracks/artists, 24 hr for recommendations)

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: Spotify OAuth 2.0
- **AI Integration**: Google Gemini 2.5 Flash API
- **Migrations**: Alembic

## Prerequisites

### Required
- **Node.js** 18+ (frontend)
- **Python** 3.10+ (backend)
- **PostgreSQL** 12+ (database)
- **Spotify Developer Account** (API credentials)
- **Google Gemini API Key** (AI recommendations)

### Optional (Development)
- **ngrok** (for HTTPS tunneling in local development)
- **Render Account** (for backend deployment)
- **Vercel Account** (for frontend deployment)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/JohnJomi/Recommendation-Model-.git
cd music-recommender
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy example env and update with your credentials
cp .env.example .env

# Update .env with:
# - SPOTIFY_CLIENT_ID
# - SPOTIFY_CLIENT_SECRET
# - GEMINI_API_KEY
# - DATABASE_URL (if not using localhost)

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --port 8000
```

**Backend runs on**: `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy example env
cp .env.example .env.local

# .env.local is already configured for localhost backend
# No changes needed unless using different backend URL

# Start development server
npm run dev
```

**Frontend runs on**: `http://localhost:3000`

### 4. Spotify Developer Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Get your **Client ID** and **Client Secret**
4. Add Redirect URI: `http://localhost:8000/auth/callback`
5. Update `backend/.env` with these credentials

### 5. Google Gemini API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Gemini API
4. Create an API key
5. Update `backend/.env` with `GEMINI_API_KEY`

## Project Structure

```
music-recommender/
├── backend/
│   ├── app/
│   │   ├── config.py              # Environment configuration
│   │   ├── database.py            # Database setup
│   │   ├── main.py                # FastAPI app entry point
│   │   ├── models/                # SQLAlchemy models
│   │   ├── routes/                # API endpoints
│   │   │   ├── auth.py            # OAuth routes
│   │   │   ├── tracks.py          # Top tracks endpoint
│   │   │   ├── artists.py         # Top artists endpoint
│   │   │   └── recommendations.py # AI recommendations endpoint
│   │   ├── services/              # Business logic
│   │   └── utils/                 # Utility functions
│   ├── alembic/                   # Database migrations
│   ├── .env.example               # Environment template
│   ├── requirements.txt           # Python dependencies
│   └── README.md
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Home page (login)
│   │   ├── dashboard/             # Top tracks page
│   │   ├── artists/               # Top artists page
│   │   ├── recommendations/       # AI recommendations page
│   │   ├── globals.css            # Global styles
│   └── components/
│       ├── Navbar.tsx             # Navigation component
│       ├── TrackCard.tsx          # Reusable track card
│       ├── ArtistCard.tsx         # Reusable artist card
│       ├── AIRecommendations.tsx  # Recommendations component
│       └── ...
│   ├── context/                   # React Context providers
│   │   ├── AuthContext.tsx        # Authentication state
│   │   └── ThemeContext.tsx       # Dark mode state
│   ├── lib/
│   │   └── env.ts                 # Environment configuration
│   ├── .env.example               # Environment template
│   ├── .env.local                 # Development configuration
│   ├── .env.production            # Production configuration
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── postcss.config.mjs
│
├── .gitignore                     # Git ignore rules
├── REFACTOR_REPORT.md             # Refactor documentation
└── README.md                      # This file
```

## Environment Variables

### Frontend (`.env.local` / `.env.production`)

```env
# API Base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
# Production: https://recommendation-model-b8bn.onrender.com
```

### Backend (`.env`)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/musicdb

# Spotify OAuth
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:8000/auth/callback

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# Application
ENVIRONMENT=development
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000
```

## API Endpoints

### Authentication
- `GET /auth/login` - Redirect to Spotify authorization
- `GET /auth/callback` - OAuth callback handler

### Tracks
- `GET /tracks/top?spotify_id={id}` - Get user's top 50 tracks

### Artists
- `GET /artists/top?spotify_id={id}` - Get user's top 50 artists

### Recommendations
- `GET /recommendations?spotify_id={id}` - Get AI-powered recommendations

### Health
- `GET /health` - Health check
- `GET /` - Root endpoint

## Data Flow

```
User Login
    ↓
Spotify OAuth
    ↓
Backend stores user + tokens
    ↓
Frontend gets spotify_id
    ↓
Frontend calls API endpoints
    ↓
Backend fetches from Spotify API
    ↓
Backend enriches with album images & URLs
    ↓
Frontend caches in sessionStorage
    ↓
Display to user
```

## Design System

### Color Palette
- **Light Mode**: Warm amber/orange (`amber-50` → `amber-950`, `orange-500`)
- **Dark Mode**: Neutral gray (`gray-700` → `gray-900`)

### Components
- **Cards**: `rounded-2xl` with `p-5` padding
- **Borders**: `rounded-2xl`, `border-2`
- **Grid**: Responsive 1-4 columns based on screen size
- **Typography**: 5xl bold titles, `text-base` body text

## Deployment

### Backend (Render)

1. Connect GitHub repository to Render
2. Set environment variables in Render dashboard:
   ```
   DATABASE_URL=your_production_db_url
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   SPOTIFY_REDIRECT_URI=https://recommendation-model-b8bn.onrender.com/auth/callback
   GEMINI_API_KEY=your_gemini_key
   ENVIRONMENT=production
   FRONTEND_URL=https://recommendation-model-iota.vercel.app
   ALLOWED_ORIGINS=https://recommendation-model-iota.vercel.app
   ```
3. Deploy
4. Update Spotify Developer Dashboard redirect URI

### Frontend (Vercel)

1. Connect GitHub repository to Vercel
2. Set environment variable:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://recommendation-model-b8bn.onrender.com
   ```
3. Deploy

## Testing

### Manual Testing
- [ ] Login with Spotify account
- [ ] View top tracks
- [ ] View top artists
- [ ] Generate AI recommendations
- [ ] Toggle dark mode
- [ ] Test caching (refresh page)
- [ ] Test on mobile devices

### API Testing
```bash
# Health check
curl http://localhost:8000/health

# Get top tracks (replace with real spotify_id)
curl "http://localhost:8000/tracks/top?spotify_id=USER_ID"

# Get recommendations
curl "http://localhost:8000/recommendations?spotify_id=USER_ID"
```

## Troubleshooting

### Issue: "Login redirects to wrong URL"
- **Solution**: Verify `NEXT_PUBLIC_API_BASE_URL` in environment
- Check `.env.local` or Vercel dashboard settings

### Issue: "API requests blocked by CORS"
- **Solution**: Verify `ALLOWED_ORIGINS` in backend `.env`
- Ensure frontend domain is included

### Issue: "Spotify authentication fails"
- **Solution**: Check Spotify Developer Dashboard
- Verify Redirect URI matches exactly: `http://localhost:8000/auth/callback`
- Confirm Client ID and Secret are correct

### Issue: "No recommendations generated"
- **Solution**: Verify `GEMINI_API_KEY` is valid
- Check that user has listening history on Spotify
- Check backend logs for API errors

### Issue: "Database connection error"
- **Solution**: Verify PostgreSQL is running
- Check `DATABASE_URL` format: `postgresql://user:password@host:5432/dbname`
- Run migrations: `alembic upgrade head`

## Documentation

- [Refactor Report](./REFACTOR_REPORT.md) - Production readiness changes
- [Backend README](./backend/README.md) - Backend specific documentation
- [Frontend README](./frontend/README.md) - Frontend specific documentation

## Security Notes

- ✅ All API keys stored in environment variables (never in source code)
- ✅ CORS configured to allow only authorized domains
- ✅ OAuth tokens stored in HTTP-only cookies (backend)
- ✅ Sensitive URLs use environment variables
- ✅ `.env` files excluded from git (see `.gitignore`)

## Production URLs

- **Backend**: https://recommendation-model-b8bn.onrender.com
- **Frontend**: https://recommendation-model-iota.vercel.app
- **OAuth Callback**: https://recommendation-model-b8bn.onrender.com/auth/callback

## Environment Configuration

The application uses environment variables for all configuration:

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Frontend API URL | `http://localhost:8000` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@localhost:5432/db` |
| `SPOTIFY_CLIENT_ID` | Spotify app ID | `46abbbdcb44b494cb9976acc1ac49017` |
| `SPOTIFY_CLIENT_SECRET` | Spotify app secret | `f3a24bcc31004d3eb41e7cffef86be04` |
| `SPOTIFY_REDIRECT_URI` | OAuth callback URL | `http://localhost:8000/auth/callback` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSyD...` |
| `ENVIRONMENT` | Environment mode | `development` or `production` |
| `FRONTEND_URL` | Frontend domain | `http://localhost:3000` |
| `ALLOWED_ORIGINS` | CORS allowed domains | `http://localhost:3000` |

## Caching Strategy

- **Top Tracks**: 5 minutes (sessionStorage)
- **Top Artists**: 5 minutes (sessionStorage)
- **AI Recommendations**: 24 hours (sessionStorage)
- Manual refresh: "Regenerate" button clears cache

## Development Workflow

```bash
# Start backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# Start frontend (in another terminal)
cd frontend
npm run dev

# Visit http://localhost:3000
```

## Dependencies

### Backend
- FastAPI
- SQLAlchemy
- Alembic
- Httpx
- Python-dotenv
- Psycopg2-binary
- Google-generativeai

### Frontend
- React 18+
- Next.js 14
- TypeScript
- Tailwind CSS
- Next/Image
- Next/Navigation

## License

This project is open source and available under the MIT License.

## Author

**JohnJomi**

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Last Updated**: February 27, 2026

**Status**: ✅ Production Ready
