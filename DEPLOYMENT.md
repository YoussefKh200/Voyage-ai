# Voyage AI — Deployment Checklist

Use this before every production deployment.

## Pre-deployment checklist

### Code quality
- [ ] `npm run check` passes (TypeScript + ESLint)
- [ ] No `console.log` statements in production code (use `logger.info`)
- [ ] All new env vars added to `.env.example` and Vercel dashboard
- [ ] No secrets committed to git (check with `git diff --staged`)

### Database
- [ ] `npx prisma migrate deploy` run (if schema changed)
- [ ] New indexes added for any new query patterns
- [ ] Connection pooler enabled for production DATABASE_URL

### Security
- [ ] Google API keys have correct restrictions in Google Cloud Console
- [ ] Rate limits are appropriate for expected traffic
- [ ] CSP headers tested in browser DevTools → Application → Security

### Performance
- [ ] `npm run analyze` run — no unexpected large bundles
- [ ] Images are next/image components (not `<img>` tags)
- [ ] New API routes have correct cache headers

## Deployment steps

```bash
# 1. Final checks
npm run check

# 2. Deploy to preview
vercel

# 3. Test on preview URL
# - Open /api/health → should return { status: "healthy" }
# - Generate a test itinerary
# - Check browser console — no errors

# 4. Deploy to production
vercel --prod

# 5. Verify production
curl https://yourdomain.com/api/health
```

## Rollback

```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

## Post-deployment verification

```bash
# Health check
curl -s https://yourdomain.com/api/health | python3 -m json.tool

# Rate limit check (should return 429 after 10 requests)
for i in {1..11}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST https://yourdomain.com/api/itinerary \
    -H "Content-Type: application/json" \
    -d '{"inputs":{"destination":"Paris","startDate":"2026-06-01","endDate":"2026-06-03","budget":2000,"travelers":2,"travelStyle":"comfort","interests":["food"]}}';
done

# SEO check
curl -s https://yourdomain.com/sitemap.xml | head -20
curl -s https://yourdomain.com/robots.txt
```

## Environment variable quick reference

| Variable | Required | Example |
|---|---|---|
| `DATABASE_URL` | Yes | `postgres://...@neon.tech/neondb` |
| `OPENAI_API_KEY` | For AI | `sk-...` |
| `GOOGLE_API_KEY` | For maps | `AIza...` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | For client maps | `AIza...` |
| `NEXT_PUBLIC_APP_URL` | Yes | `https://yourdomain.com` |
| `SENTRY_DSN` | Recommended | `https://...@sentry.io/...` |

## Monitoring URLs

| URL | Purpose |
|---|---|
| `https://yourdomain.com/api/health` | Service health check |
| `https://vercel.com/[team]/[project]/analytics` | Page analytics |
| `https://vercel.com/[team]/[project]/speed-insights` | Core Web Vitals |
| `https://sentry.io` | Error tracking |
