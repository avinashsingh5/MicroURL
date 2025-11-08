# MERN URL Shortener - Serverless

A full-stack URL shortener built with MERN stack, ready for serverless deployment on Vercel/Netlify.

## Features

- ✅ **User Authentication** - Register and login to track your links
- ✅ **URL Shortening** - Shorten long URLs into minimal-length links
- ✅ **Customizable Slug** - Enter custom slugs (case-sensitive)
- ✅ **AI Slug Generation** - OpenAI-powered smart slug generation
- ✅ **Link Expiration** - Set expiration time in hours or days
- ✅ **Analytics** - Track clicks, creation time, and expiry date
- ✅ **User Dashboard** - View all your links and their analytics
- ✅ **Serverless Ready** - Optimized for Vercel/Netlify deployment

## Tech Stack

### Backend
- Express.js
- Mongoose (MongoDB)
- JWT (authentication)
- bcryptjs (password hashing)
- nanoid (slug generation)
- OpenAI API
- dotenv

### Frontend
- React + Vite
- Axios
- Tailwind CSS

## Setup

### 1. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/urlshortener?retryWrites=true&w=majority
OPENAI_API_KEY=sk-your-openai-api-key-here
JWT_SECRET=your-super-secret-jwt-key-change-in-production
BASE_URL=http://localhost:5000
PORT=5000
```

### 2. Frontend Setup

```bash
cd client
npm install
```

Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000
```

### 3. Run Locally

**Backend:**
```bash
cd server
npm start
# or for development with auto-reload
npm run dev
```

**Frontend:**
```bash
cd client
npm run dev
```

## Deployment on Vercel

### Prerequisites
- Vercel account
- MongoDB Atlas account
- OpenAI API key

### Step 1: Deploy Backend

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Navigate to server directory:**
```bash
cd server
```

3. **Deploy:**
```bash
vercel
```

4. **Set Environment Variables in Vercel Dashboard:**
   - Go to your project settings → Environment Variables
   - Add:
     - `MONGO_URI` - Your MongoDB Atlas connection string
     - `OPENAI_API_KEY` - Your OpenAI API key
     - `BASE_URL` - Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)

5. **Redeploy after adding environment variables:**
```bash
vercel --prod
```

### Step 2: Deploy Frontend

1. **Navigate to client directory:**
```bash
cd client
```

2. **Update `.env` or create `.env.production`:**
```env
VITE_API_URL=https://your-backend.vercel.app
```

3. **Build the frontend:**
```bash
npm run build
```

4. **Deploy to Vercel:**
```bash
vercel
```

5. **Or deploy via Vercel Dashboard:**
   - Connect your GitHub repository
   - Set root directory to `client`
   - Build command: `npm run build`
   - Output directory: `dist`
   - Add environment variable: `VITE_API_URL` = your backend URL

### Alternative: Deploy Both Together

If you want to deploy both in a monorepo:

1. **Create `vercel.json` in root:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.js",
      "use": "@vercel/node"
    },
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/api/url.js"
    },
    {
      "src": "/(.*)",
      "dest": "/client/$1"
    }
  ]
}
```

2. **Deploy from root:**
```bash
vercel
```

## API Endpoints

### Authentication

#### POST `/api/auth/register`
Register a new user.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### POST `/api/auth/login`
Login user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

#### GET `/api/auth/me`
Get current user (requires authentication header: `Authorization: Bearer <token>`).

### URL Shortening

#### POST `/api/shorten`
Create a short URL (works with or without authentication).

**Request Body:**
```json
{
  "url": "https://example.com/very/long/url",
  "customSlug": "optional-custom-slug",
  "useAISlug": false,
  "expirationHours": 24,
  "expirationDays": 7
}
```

**Response:**
```json
{
  "success": true,
  "shortUrl": "https://your-domain.com/abc123",
  "slug": "abc123",
  "originalUrl": "https://example.com/very/long/url",
  "expiresAt": "2024-12-31T23:59:59.000Z"
}
```

### GET `/:slug`
Redirect to original URL (increments click count).

### GET `/api/analytics/:slug`
Get analytics for a short URL (public).

### GET `/api/my-links`
Get all links for authenticated user (requires authentication).

**Response:**
```json
{
  "success": true,
  "count": 5,
  "links": [
    {
      "_id": "link-id",
      "originalUrl": "https://example.com",
      "slug": "abc123",
      "shortUrl": "http://localhost:5000/abc123",
      "clicks": 42,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "expiresAt": null,
      "isExpired": false
    }
  ]
}
```

### GET `/api/my-links/:slug/analytics`
Get analytics for user's specific link (requires authentication).

### GET `/api/my-links/:slug/qrcode`
Generate QR code for user's link (requires authentication, rate limited).

**Rate Limit:** 15 requests per 15 minutes per user

**Response:**
```json
{
  "success": true,
  "qrCode": "data:image/png;base64,iVBORw0KG...",
  "shortUrl": "http://localhost:5000/abc123"
}
```

### GET `/api/analytics/:slug/qrcode`
Generate QR code via analytics endpoint (requires authentication, rate limited).

**Response:**
```json
{
  "slug": "abc123",
  "originalUrl": "https://example.com/very/long/url",
  "clicks": 42,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "expiresAt": "2024-12-31T23:59:59.000Z",
  "isExpired": false
}
```

## Project Structure

```
.
├── server/
│   ├── api/
│   │   └── url.js          # Main API routes
│   ├── index.js            # Express server setup
│   ├── package.json
│   ├── vercel.json         # Vercel serverless config
│   └── .env                # Backend environment variables
├── client/
│   ├── src/
│   │   ├── App.jsx         # React UI component
│   │   ├── main.jsx        # React entry point
│   │   └── index.css       # Tailwind styles
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env                # Frontend environment variables
└── README.md
```

## Environment Variables

### Server (.env)
- `MONGO_URI` - MongoDB Atlas connection string
- `OPENAI_API_KEY` - OpenAI API key for AI slug generation
- `JWT_SECRET` - Secret key for JWT token signing (use a strong random string in production)
- `BASE_URL` - Base URL for short links (e.g., `https://your-app.vercel.app`)
- `PORT` - Server port (default: 5000)

### Client (.env)
- `VITE_API_URL` - Backend API URL (e.g., `https://your-backend.vercel.app`)

## License

ISC

