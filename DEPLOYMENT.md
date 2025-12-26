# thehole.app - Production Deployment Guide

## Prerequisites

1. **Supabase Project**
   - Create a project at [supabase.com](https://supabase.com)
   - Note your project URL and anon key from Settings > API

2. **Mapbox Account**
   - Create account at [mapbox.com](https://mapbox.com)
   - Generate access token from Account > Access Tokens

3. **Vercel Account** (recommended) or any Next.js hosting
   - Sign up at [vercel.com](https://vercel.com)

## Environment Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your credentials in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token-here
   ```

## PWA Icons Setup

Before deploying, you need to create app icons:

1. Design icons at 512x512px matching the app's dark theme
2. Export two sizes:
   - `public/icons/icon-192.png` (192x192px)
   - `public/icons/icon-512.png` (512x512px)
3. Optimize with ImageOptim or TinyPNG

See `public/icons/README.md` for detailed guidelines.

## Deployment to Vercel

### Option 1: Deploy via Git (Recommended)

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/thehole-app.git
   git push -u origin main
   ```

2. Import project in Vercel:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Configure environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `NEXT_PUBLIC_MAPBOX_TOKEN`
   - Deploy

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login and deploy:
   ```bash
   vercel login
   vercel --prod
   ```

3. Add environment variables:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add NEXT_PUBLIC_MAPBOX_TOKEN
   ```

## Post-Deployment Checklist

- [ ] Test PWA installation on mobile devices
- [ ] Verify all environment variables are set correctly
- [ ] Check error boundary displays properly
- [ ] Test loading states with slow network
- [ ] Verify Mapbox maps load correctly
- [ ] Test Supabase authentication flow
- [ ] Check security advisors in Supabase dashboard
- [ ] Enable Row Level Security (RLS) on all tables
- [ ] Set up database backups
- [ ] Configure custom domain (optional)
- [ ] Add SSL certificate (automatic with Vercel)
- [ ] Test on iOS Safari and Android Chrome
- [ ] Verify manifest.json serves correctly

## Database Setup (Supabase)

Required tables and RLS policies should be configured in your Supabase project. See database schema documentation for details.

Key security requirements:
- Enable RLS on all public tables
- Create policies for authenticated users only
- Set up proper indexes for performance
- Configure storage buckets with appropriate policies

## Monitoring

Consider adding:
- Error tracking: Sentry
- Analytics: Google Analytics or Plausible
- Performance monitoring: Vercel Analytics

Add these to `.env.example` and `vercel.json` as needed.

## Domain Configuration

To use a custom domain:

1. In Vercel dashboard, go to Settings > Domains
2. Add your domain (e.g., thehole.app)
3. Update DNS records as instructed
4. SSL certificate will be automatically provisioned

## Troubleshooting

**PWA not installing:**
- Ensure manifest.json is accessible at /manifest.json
- Check browser console for manifest errors
- Verify icons exist and are valid PNGs

**Map not loading:**
- Verify NEXT_PUBLIC_MAPBOX_TOKEN is set
- Check Mapbox token permissions
- Ensure token is for the correct domain

**Supabase connection issues:**
- Verify URL and anon key are correct
- Check CORS settings in Supabase
- Ensure RLS policies allow access

**Build failures:**
- Run `npm run build` locally to test
- Check for TypeScript errors
- Verify all environment variables are set

## Security Best Practices

1. Never commit `.env.local` to git
2. Use Supabase RLS for all data access
3. Rotate API keys regularly
4. Enable 2FA on Supabase and Vercel accounts
5. Monitor Supabase advisor for security issues
6. Keep dependencies updated (`npm audit`)

## Updates and Maintenance

To deploy updates:
```bash
git add .
git commit -m "Description of changes"
git push
```

Vercel will automatically deploy on push to main branch.

## Support

For issues or questions:
- Check Next.js docs: [nextjs.org/docs](https://nextjs.org/docs)
- Supabase docs: [supabase.com/docs](https://supabase.com/docs)
- Vercel docs: [vercel.com/docs](https://vercel.com/docs)
