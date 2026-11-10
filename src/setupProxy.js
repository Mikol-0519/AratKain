/**
 * CRA development-server proxy: forwards /api/* to the Spring backend.
 *
 *   - `npm start` locally      → target http://localhost:8080 (default)
 *   - `docker compose up` web  → target http://backend:8080 (BACKEND_PROXY env
 *                                set by docker-compose.yml at the workspace root)
 *
 * This file is only loaded by the dev server (react-scripts start); production
 * builds ignore it entirely - on Vercel, vercel.json rewrites /api/* to the
 * deployed backend instead.
 */
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.BACKEND_PROXY || 'http://localhost:8080',
      changeOrigin: true,
    })
  );
};
