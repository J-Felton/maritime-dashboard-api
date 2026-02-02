import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { clerkAuth } from './middleware/auth.js';
import users from './routes/users.js';
import vessels from './routes/vessels.js';

const app = new Hono();

// CORS configuration
app.use('/*', cors({
  origin: ['https://your-frontend-domain.pages.dev', 'http://localhost:5173'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Health check endpoint (no auth required)
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protected routes - require authentication
app.use('/api/*', clerkAuth);

// Mount route handlers
app.route('/api/users', users);
app.route('/api/vessels', vessels);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
