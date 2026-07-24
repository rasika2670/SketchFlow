export const env = {
  API_URL: import.meta.env.VITE_API_URL || '/api',
  WS_URL: import.meta.env.VITE_WS_URL || 'http://localhost:5000',
  CLOUDINARY_CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
};
