# Solar PV Testing System - Deployment Guide

## Production Deployment to Netlify

### Prerequisites

1. **Netlify Account**: Create account at [netlify.com](https://netlify.com)
2. **Supabase Project**: Ensure your Supabase project is configured and accessible
3. **GitHub Repository**: Code should be in a Git repository connected to GitHub

### Environment Variables

Set these environment variables in your Netlify dashboard under **Site Settings > Environment Variables**:

#### Required Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-netlify-domain.netlify.app
NODE_ENV=production
NEXTAUTH_SECRET=your-production-secret-key
JWT_SECRET=your-jwt-secret-key

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760
ALLOWED_FILE_TYPES=.xlsx,.xls,.csv

# Build Configuration
NEXT_TELEMETRY_DISABLED=1
NODE_VERSION=18
NPM_FLAGS=--production=false
```

### Database Setup

1. **Run Database Migrations**:
   - Execute the SQL schema in `scripts/database-schema.sql` in your Supabase SQL editor
   - Ensure all tables, indexes, and RLS policies are created

2. **Configure Storage Bucket**:
   ```sql
   -- Create bucket for Excel files
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('excel-files', 'excel-files', false);
   
   -- Set up storage policies
   CREATE POLICY "Users can upload Excel files" ON storage.objects
   FOR INSERT WITH CHECK (bucket_id = 'excel-files' AND auth.role() = 'authenticated');
   
   CREATE POLICY "Users can read their Excel files" ON storage.objects
   FOR SELECT USING (bucket_id = 'excel-files' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

3. **Create Initial Admin User**:
   ```sql
   -- After first user signs up, promote to admin
   UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@domain.com';
   ```

### Netlify Deployment Steps

#### Method 1: GitHub Integration (Recommended)

1. **Connect Repository**:
   - Go to Netlify Dashboard > New site from Git
   - Connect your GitHub account
   - Select the repository containing your Solar PV Testing System

2. **Configure Build Settings**:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `.next`
   - **Base Directory**: (leave empty)

3. **Install Required Plugin**:
   - The `@netlify/plugin-nextjs` is already configured in `netlify.toml`
   - Netlify will automatically install it during deployment

4. **Set Environment Variables**:
   - Add all environment variables listed above in Site Settings

5. **Deploy**:
   - Click "Deploy Site"
   - Netlify will automatically build and deploy your application

#### Method 2: Netlify CLI Deployment

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Initialize Netlify Site**:
   ```bash
   netlify init
   ```

4. **Deploy**:
   ```bash
   # Build the application
   npm run build
   
   # Deploy to production
   netlify deploy --prod
   ```

### Build Optimization Features

The production build includes these optimizations:

- **SWC Minification**: Faster JavaScript minification
- **Code Splitting**: Separate chunks for vendors, Recharts, and XLSX libraries
- **CSS Optimization**: Optimized CSS with experimental features
- **Package Import Optimization**: Optimized imports for Recharts and XLSX
- **Security Headers**: Comprehensive security headers configuration
- **Image Optimization**: WebP and AVIF support with Supabase domains

### Performance Monitoring

After deployment, monitor these metrics:

1. **Core Web Vitals**: Use Netlify Analytics or Google PageSpeed Insights
2. **API Response Times**: Monitor Supabase dashboard for database performance
3. **Error Rates**: Check Netlify Functions logs for API errors
4. **File Upload Success**: Monitor Excel import/export functionality

### Security Configuration

Production security features enabled:

- **Content Security Policy**: Restrictive CSP headers
- **Frame Protection**: X-Frame-Options set to DENY
- **XSS Protection**: X-XSS-Protection enabled
- **Content Type Protection**: X-Content-Type-Options set to nosniff
- **Referrer Policy**: Strict referrer policy
- **Row Level Security**: Database-level security policies
- **Role-based Access Control**: Application-level permissions

### Custom Domain Setup (Optional)

1. **Purchase Domain**: Buy domain from registrar
2. **Configure DNS**: Point domain to Netlify
3. **Add Custom Domain**: In Netlify Site Settings > Domain Management
4. **Enable HTTPS**: Netlify automatically provisions SSL certificates

### Troubleshooting

#### Common Deployment Issues:

1. **Build Failures**:
   - Check Node.js version (should be 18+)
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Environment Variable Issues**:
   - Ensure all required variables are set in Netlify
   - Check variable names match exactly
   - Verify Supabase URLs and keys are correct

3. **Database Connection Issues**:
   - Verify Supabase project is active
   - Check RLS policies are configured correctly
   - Ensure service role key has proper permissions

4. **File Upload Issues**:
   - Verify Supabase storage bucket exists
   - Check storage policies are configured
   - Confirm file size limits in environment variables

### Post-Deployment Checklist

- [ ] Application loads successfully
- [ ] User authentication works
- [ ] Device management functional
- [ ] Excel import/export works
- [ ] Dashboard charts display correctly
- [ ] Database operations successful
- [ ] File uploads working
- [ ] All API endpoints responding
- [ ] Security headers present
- [ ] SSL certificate active
- [ ] Custom domain configured (if applicable)

### Support and Monitoring

- **Netlify Support**: Available through Netlify dashboard
- **Supabase Support**: Available through Supabase dashboard
- **Application Logs**: Available in Netlify Functions tab
- **Database Logs**: Available in Supabase dashboard

### Backup Strategy

1. **Database Backups**: Automatic Supabase backups enabled
2. **Code Backups**: Git repository serves as code backup
3. **File Backups**: Supabase storage includes backup capabilities
4. **Environment Variables**: Document all variables securely

## Continuous Integration/Continuous Deployment (CI/CD)

The system supports automatic deployment on Git push:

1. **GitHub Integration**: Automatic builds on push to main branch
2. **Preview Deployments**: Automatic preview deployments for pull requests
3. **Rollback Support**: Easy rollback to previous deployments
4. **Build Notifications**: Email notifications for build status

### Deployment URL

After successful deployment, your Solar PV Testing System will be available at:
`https://your-site-name.netlify.app`

Or your custom domain if configured.