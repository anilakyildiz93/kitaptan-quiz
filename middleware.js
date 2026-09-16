// Vercel Edge Middleware
// - /admin.html, /api/generate-quiz, /api/save-quiz -> sadece ADMIN_AUTH_TOKEN
// - / (index.html), /api/get-quiz -> ADMIN_AUTH_TOKEN veya CHILD_AUTH_TOKEN
// Bu dosya sadece Vercel'de çalışır.

import { next } from '@vercel/edge';

export const config = {
  matcher: '/((?!api/login|login.html).*)',
};

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    out[key] = decodeURIComponent(val);
  });
  return out;
}

const ADMIN_ONLY_PATHS = ['/admin.html', '/api/generate-quiz', '/api/save-quiz'];

export default function middleware(request) {
  const cookies = parseCookies(request.headers.get('cookie'));
  const token = cookies['session'];
  const adminToken = process.env.ADMIN_AUTH_TOKEN;
  const childToken = process.env.CHILD_AUTH_TOKEN;

  const isAdmin = !!adminToken && token === adminToken;
  const isChild = !!childToken && token === childToken;

  const url = new URL(request.url);
  const needsAdmin = ADMIN_ONLY_PATHS.some((p) => url.pathname === p);

  const authorized = needsAdmin ? isAdmin : (isAdmin || isChild);

  if (authorized) {
    return next();
  }

  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ error: 'Giriş yapmanız gerekiyor.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return Response.redirect(new URL('/login.html', request.url));
}
