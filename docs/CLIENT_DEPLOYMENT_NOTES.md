# Client Deployment Notes

## Hosting Target

The RS Real Estate client dashboard is a Vite static frontend.

## Build Settings

Build command:

npm run build

Output directory:

dist

## Required Environment Variable

VITE_API_BASE_URL=https://your-backend-domain.com/api/v1

## Vercel Routing

The `vercel.json` file rewrites all routes to `index.html`.

This prevents refresh/deep-link 404 issues for client-side routes.

## Security Headers

The deployment config adds basic production headers:

- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy
- Permissions-Policy

## Final Deployment Check

Before marking the client deployment as ready:

- [ ] Production backend URL is deployed
- [ ] VITE_API_BASE_URL points to production backend
- [ ] CORS allows frontend production domain
- [ ] Login works on production frontend
- [ ] Dashboard opens after refresh
- [ ] Sidebar navigation works after refresh
- [ ] Media upload URL resolves correctly
- [ ] No blocking browser console errors
