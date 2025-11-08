# URL Shortener - Backend

Serverless Express.js backend for URL shortening service.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/urlshortener?retryWrites=true&w=majority
OPENAI_API_KEY=sk-your-openai-api-key-here
BASE_URL=http://localhost:5000
PORT=5000
```

3. Run locally:
```bash
npm start
# or for development
npm run dev
```

## API Endpoints

- `POST /api/shorten` - Create short URL
- `GET /api/analytics/:slug` - Get analytics
- `GET /:slug` - Redirect to original URL
- `GET /health` - Health check

## Deployment

See [../DEPLOYMENT.md](../DEPLOYMENT.md) for Vercel deployment instructions.

