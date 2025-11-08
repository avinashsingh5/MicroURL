# Deployment Guide - Vercel

This guide provides exact terminal commands for deploying the URL Shortener app to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas**: Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)


## Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

## Step 2: Deploy Backend (Server)

```bash
# Navigate to server directory
cd server

# Login to Vercel (first time only)
vercel login

# Deploy to Vercel
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? url-shortener-server (or your choice)
# - Directory? ./
# - Override settings? No
```

After deployment, note your deployment URL (e.g., `https://url-shortener-server.vercel.app`)

## Step 3: Set Backend Environment Variables

```bash
# Set environment variables in Vercel
vercel env add MONGO_URI
# Paste your MongoDB Atlas connection string when prompted

vercel env add OPENAI_API_KEY
# Paste your OpenAI API key when prompted

vercel env add BASE_URL
# Enter your Vercel backend URL (e.g., https://url-shortener-server.vercel.app)

vercel env add JWT_SECRET
# Enter a strong random string for JWT token signing
```

**Or via Vercel Dashboard:**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   - `MONGO_URI` = `mongodb+srv://username:password@cluster.mongodb.net/urlshortener?retryWrites=true&w=majority`
   - `OPENAI_API_KEY` = `sk-your-openai-api-key`
   - `JWT_SECRET` = `your-super-secret-jwt-key` (use a strong random string)
   - `BASE_URL` = `https://your-backend.vercel.app`

## Step 4: Redeploy Backend with Environment Variables

```bash
# Still in server directory
vercel --prod
```

## Step 5: Deploy Frontend (Client)

```bash
# Navigate to client directory
cd ../client

# Create production environment file
echo VITE_API_URL=https://your-backend.vercel.app > .env.production
# Replace 'your-backend.vercel.app' with your actual backend URL

# Deploy to Vercel
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? url-shortener-client (or your choice)
# - Directory? ./
# - Override settings? No
# - Build command? npm run build
# - Output directory? dist
```

## Step 6: Set Frontend Environment Variable

```bash
# Set VITE_API_URL for production
vercel env add VITE_API_URL production
# Enter your backend URL when prompted
```

**Or via Vercel Dashboard:**
1. Go to your frontend project in Vercel Dashboard
2. Settings → Environment Variables
3. Add:
   - `VITE_API_URL` = `https://your-backend.vercel.app` (Production)

## Step 7: Redeploy Frontend

```bash
# Still in client directory
vercel --prod
```

## Alternative: Monorepo Deployment

If you want to deploy both backend and frontend from the root:

### Option 1: Separate Projects (Recommended)

Deploy server and client as separate Vercel projects (as shown above).

### Option 2: Single Project with Rewrites

Create `vercel.json` in root:

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

Then deploy from root:
```bash
cd ..
vercel
```

## Verification

1. **Backend Health Check**: Visit `https://your-backend.vercel.app/health`
   - Should return: `{"status":"ok"}`

2. **Frontend**: Visit `https://your-frontend.vercel.app`
   - Should show the URL Shortener UI

3. **Test Shortening**:
   - Enter a URL
   - Click "Shorten URL"
   - Verify short URL is created
   - Click the short URL to test redirect

## Troubleshooting

### Backend Issues

- **MongoDB Connection Error**: Verify `MONGO_URI` is correct and includes database name
- **OpenAI API Error**: Check `OPENAI_API_KEY` is valid
- **Routes Not Working**: Ensure `BASE_URL` matches your deployment URL

### Frontend Issues

- **API Calls Failing**: Verify `VITE_API_URL` points to correct backend URL
- **Build Errors**: Check browser console for CORS or API errors

### Common Commands

```bash
# View deployment logs
vercel logs

# List all deployments
vercel ls

# Remove deployment
vercel remove

# View project info
vercel inspect
```

## Production Checklist

- [ ] Backend deployed and accessible
- [ ] Environment variables set in Vercel
- [ ] Frontend deployed and accessible
- [ ] `VITE_API_URL` points to production backend
- [ ] MongoDB Atlas IP whitelist includes Vercel (or 0.0.0.0/0 for development)
- [ ] Test URL shortening works
- [ ] Test redirect works
- [ ] Test analytics works
- [ ] Test custom slug works
- [ ] Test AI slug generation works
- [ ] Test expiration works

## Notes

- Vercel automatically handles serverless function cold starts
- MongoDB Atlas free tier is sufficient for development
- OpenAI API usage will incur costs based on usage
- Consider setting up custom domains in Vercel for production

