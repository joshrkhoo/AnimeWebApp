import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Set up the root container for the app
const container = document.getElementById('root');
// Create a root for the app
const root = createRoot(container);
root.render(<App />);