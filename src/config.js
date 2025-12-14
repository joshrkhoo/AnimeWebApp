// API Configuration
// CRA environment variables are resolved at BUILD time
// Set REACT_APP_API_URL in .env.production for production builds
// Set REACT_APP_API_URL in .env.development (or .env) for local development

const API_URL =
  process.env.REACT_APP_API_URL ||
  'https://animewebappapi.onrender.com';

console.log("API_URL (baked):", API_URL);
console.log("REACT_APP_API_URL:", process.env.REACT_APP_API_URL);
console.log("NODE_ENV:", process.env.NODE_ENV);


export { API_URL };

