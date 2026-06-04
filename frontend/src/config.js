// API Configuration
// In production, uses relative URLs (nginx proxies /students to backend)
// For development, set VITE_API_URL=http://localhost:8000
// Empty string means relative URLs (same origin)
export const API_URL = import.meta.env.VITE_API_URL || "";


