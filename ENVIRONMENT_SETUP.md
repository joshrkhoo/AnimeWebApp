# Environment Setup Guide

This guide explains how to separate local and production environments for your Anime Web App.

## Frontend Changes (Completed)

I've updated your React frontend to use environment variables for API URLs:

1. **Created `src/config.js`** - Centralized configuration that reads from environment variables
2. **Updated all API calls** - `AnimeContext.jsx`, `AnimeScheduler.jsx`, and `App.jsx` now use the config
3. **Removed hardcoded URLs** - No more hardcoded API URLs in your code

## Setting Up Environment Variables

### For Local Development

Create a `.env` file in the `anime_web_app` directory:

```bash
cd anime_web_app
touch .env
```

Add the following content to `.env`:

```
# Local Development Environment Variables
REACT_APP_API_URL=http://127.0.0.1:5000
```

### For Production Builds

Create a `.env.production` file in the `anime_web_app` directory:

```bash
cd anime_web_app
touch .env.production
```

Add the following content to `.env.production`:

```
# Production Environment Variables
REACT_APP_API_URL=https://animewebappapi.onrender.com
```

## How It Works

- **Development (`npm start`)**: Uses `.env` file → Points to `http://127.0.0.1:5000`
- **Production (`npm run build`)**: Uses `.env.production` file → Points to `https://animewebappapi.onrender.com`

The `.env` files are already in your `.gitignore`, so they won't be committed to git.

## Backend Setup (MongoDB Database Separation)

Your backend is separate (likely at `animewebappapi.onrender.com`). To separate local and production databases:

### Option 1: Environment Variables in Backend

Your backend should use environment variables for MongoDB connection strings:

**Local Backend `.env`:**
```
MONGODB_URI=mongodb://localhost:27017/animewebapp
# OR if using MongoDB Atlas with a separate cluster:
# MONGODB_URI=mongodb+srv://username:password@local-cluster.mongodb.net/animewebapp?retryWrites=true&w=majority
```

**Production Backend `.env` (on Render.com):**
```
MONGODB_URI=mongodb+srv://username:password@production-cluster.mongodb.net/animewebapp?retryWrites=true&w=majority
```

### Option 2: Using MongoDB Atlas with Separate Clusters

1. **Create a separate MongoDB Atlas cluster for local development**
   - Go to MongoDB Atlas
   - Create a new cluster (e.g., "Local Development")
   - Get the connection string
   - Add it to your local backend `.env` file

2. **Keep your production cluster separate**
   - Your existing production cluster stays as-is
   - Add its connection string to your production backend environment variables on Render.com

### Backend Code Example

Your backend should read the MongoDB URI from environment variables:

```javascript
// Example backend code (Node.js/Express)
const mongoose = require('mongoose');

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/animewebapp';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));
```

## Testing the Setup

### Local Development
1. Make sure your local backend is running on `http://127.0.0.1:5000`
2. Make sure your local backend is connected to your local MongoDB (or local dev Atlas cluster)
3. Run `npm start` in the frontend
4. The app should connect to your local backend → local database

### Production
1. Make sure your production backend on Render.com has the production MongoDB URI set
2. Run `npm run build` in the frontend
3. Deploy the build
4. The app should connect to production backend → production database

## Quick Reference

| Environment | Frontend API URL | Backend MongoDB |
|------------|-----------------|-----------------|
| Local | `http://127.0.0.1:5000` | Local MongoDB or Local Atlas Cluster |
| Production | `https://animewebappapi.onrender.com` | Production Atlas Cluster |

## Troubleshooting

- **Frontend can't connect**: Check that `REACT_APP_API_URL` is set correctly in your `.env` file
- **Backend can't connect to DB**: Check that `MONGODB_URI` is set correctly in your backend environment
- **Still using wrong database**: Make sure you restarted your backend server after changing environment variables
- **Environment variables not loading**: In React, you need to restart the dev server (`npm start`) after changing `.env` files

