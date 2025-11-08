# Quick Start Guide

Get the URL Shortener app running locally in minutes.

## Prerequisites

- Node.js 16+ installed
- MongoDB Atlas account (free tier works)
- OpenAI API key

## Step 1: Backend Setup

```bash
cd server
npm install
```

Create `server/.env`:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/urlshortener?retryWrites=true&w=majority
OPENAI_API_KEY=sk-your-openai-api-key-here
JWT_SECRET=your-super-secret-jwt-key-change-in-production
BASE_URL=http://localhost:5000
PORT=5000
```

Start backend:
```bash
npm start
```

Backend runs on `http://localhost:5000`

## Step 2: Frontend Setup

Open a new terminal:

```bash
cd client
npm install
```

Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000
```

Start frontend:
```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

## Step 3: Test It!

1. Open `http://localhost:3000` in your browser
2. **Sign up** for an account (or login if you have one)
3. Enter a URL (e.g., `https://example.com`)
4. Optionally:
   - Enter a custom slug
   - Toggle AI slug generation
   - Set expiration time
5. Click "Shorten URL"
6. View your links in the **Dashboard** tab
7. Click "View Analytics" on any link to see detailed stats!

## Troubleshooting

**Backend won't start:**
- Check MongoDB connection string is correct
- Ensure `.env` file exists in `server/` directory
- Verify port 5000 is not in use

**Frontend can't connect:**
- Ensure backend is running
- Check `VITE_API_URL` in `client/.env` matches backend URL
- Check browser console for CORS errors

**MongoDB connection fails:**
- Verify MongoDB Atlas cluster is running
- Check IP whitelist includes your IP (or 0.0.0.0/0 for development)
- Verify username/password in connection string

**OpenAI API errors:**
- Verify API key is correct
- Check you have credits in your OpenAI account
- AI slug will fallback to random slug if API fails

## Next Steps

- See [README.md](README.md) for full documentation
- See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment

