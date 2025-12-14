// API Configuration
// Uses environment variables to determine which API URL to use
// In development: uses REACT_APP_API_URL from .env file (defaults to localhost:5000)
// In production: uses REACT_APP_API_URL from .env.production (defaults to production URL)

const getApiUrl = () => {
  // Check if REACT_APP_API_URL is set in environment variables
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Default fallback based on environment
  if (process.env.NODE_ENV === 'production') {
    return 'https://animewebappapi.onrender.com';
  }
  
  // Default to local for development
  return 'http://127.0.0.1:5000';
};

export const API_URL = getApiUrl();

