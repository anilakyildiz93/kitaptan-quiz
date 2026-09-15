// Vercel Edge Middleware
// Siteye gelen her isteği kontrol eder: geçerli bir oturum çerezi (cookie) yoksa
// /login.html sayfasına yönlendirir. Bu dosya sadece Vercel'de çalışır.

import { next } from '@vercel/edge';

export const config = {
  // login.html ve /api/login hariç HER şeyi bu middleware'den geçir.
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

export default function middleware(request) {
  const cookies = parseCookies(request.headers.get('cookie'));
  const token = cookies['session'];
  const expected = process.env.AUTH_TOKEN;

  if (expected && token === expected) {
    return next();
  }

  const url = new URL(request.url);

  // API isteği ise (örn. /api/generate-quiz) yönlendirme yerine 401 JSON döndür.
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ error: 'Giriş yapmanız gerekiyor.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return Response.redirect(new URL('/login.html', request.url));
}
