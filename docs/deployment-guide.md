# Solar PV Testing System - Deployment Guide

## Prerequisites

1. Node.js 18+ installed
2. Supabase account created
3. Netlify account (for deployment)
4. Git repository set up

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd solar-testing-system
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Set Up Supabase

1. Create a new Supabase project at [https://supabase.com](https://supabase.com)
2. Go to Settings > API to find your project URL and keys
3. Go to SQL Editor and run the database schema:
   - First run `/scripts/database-schema.sql`
   - Then run `/scripts/setup-database.sql`

### 4. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### 5. Create Test Users

1. Go to Supabase Dashboard > Authentication > Users
2. Create test users with these emails:
   - admin@test.com
   - manager@test.com
   - engineer@test.com
   - viewer@test.com

3. After creating users, run the SQL in `/scripts/create-test-users.sql` to assign roles
   (You'll need to get the user IDs from the auth.users table first)

### 6. Run Development Server

```bash
npm run dev
# or
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Production Deployment (Netlify)

### 1. Prepare for Deployment

1. Ensure all code is committed to your Git repository
2. Make sure your Supabase project is properly configured

### 2. Deploy to Netlify

#### Option A: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize Netlify project
netlify init

# Deploy
netlify deploy --prod
```

#### Option B: Deploy via Netlify Dashboard

1. Go to [https://app.netlify.com](https://app.netlify.com)
2. Click "Add new site" > "Import an existing project"
3. Connect your Git repository
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Add environment variables in Netlify dashboard:
   - All variables from `.env.local` (except NEXT_PUBLIC_ prefixed ones)
   - NEXT_PUBLIC_ variables should be added separately

### 3. Configure Environment Variables in Netlify

Go to Site settings > Environment variables and add:

```
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-key
```

### 4. Set Up Custom Domain (Optional)

1. Go to Domain settings in Netlify
2. Add your custom domain
3. Configure DNS settings as instructed

## Post-Deployment Tasks

### 1. Verify Deployment

1. Visit your deployed site
2. Test login with different user roles
3. Verify all features are working:
   - Device management
   - Test session creation
   - Data import/export
   - Report generation

### 2. Set Up Monitoring

1. Enable Netlify Analytics (optional)
2. Set up error tracking (e.g., Sentry)
3. Configure uptime monitoring

### 3. Security Checklist

- [ ] Ensure all environment variables are properly set
- [ ] Verify Supabase RLS policies are enabled
- [ ] Check that service role key is not exposed
- [ ] Enable HTTPS (automatic with Netlify)
- [ ] Review and update CORS settings if needed

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables" error**
   - Ensure all environment variables are set in Netlify
   - Rebuild and redeploy after adding variables

2. **Authentication not working**
   - Check Supabase Auth settings
   - Verify redirect URLs include your production domain

3. **Database queries failing**
   - Check RLS policies in Supabase
   - Ensure database schema is properly set up

4. **Build failures**
   - Check build logs in Netlify
   - Ensure all dependencies are listed in package.json
   - Try building locally first

### Getting Help

- Check the [README.md](../README.md) for general information
- Review [architecture.md](./architecture.md) for technical details
- Contact the development team for specific issues

## Maintenance

### Regular Tasks

1. **Weekly**
   - Review error logs
   - Check system performance
   - Monitor database size

2. **Monthly**
   - Update dependencies
   - Review and optimize database queries
   - Check for security updates

3. **Quarterly**
   - Review user access and roles
   - Audit system usage
   - Plan feature updates

### Backup Strategy

1. **Database Backups**
   - Supabase provides automatic daily backups
   - Consider additional backup strategies for critical data

2. **Code Backups**
   - Use Git for version control
   - Tag releases for easy rollback

3. **Configuration Backups**
   - Document all environment variables
   - Keep copies of configuration files