#!/bin/bash

# Solar PV Testing System - Deployment Script
# This script handles the deployment process for Netlify

set -e

echo "🚀 Starting Solar PV Testing System deployment..."

# Check Node.js version
echo "📋 Checking Node.js version..."
node --version

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run linting and type checking
echo "🔍 Running linting and type checking..."
npm run lint || echo "⚠️ Linting warnings detected, continuing..."

# Run build
echo "🏗️ Building application..."
npm run build

# Run post-build checks
echo "✅ Build completed successfully!"
echo "📊 Build size analysis:"
ls -la .next/

# Database setup reminder
echo ""
echo "🗄️  Database Setup Reminder:"
echo "   Make sure to run the database schema in scripts/database-schema.sql"
echo "   Set up Supabase storage bucket 'excel-files'"
echo "   Configure Row Level Security policies"
echo ""

# Environment variables reminder
echo "🔧 Environment Variables Reminder:"
echo "   Set the following in your Netlify dashboard:"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - NEXT_PUBLIC_APP_URL"
echo "   - NODE_ENV=production"
echo "   - NEXTAUTH_SECRET"
echo "   - JWT_SECRET"
echo ""

echo "✨ Deployment preparation complete!"
echo "🌐 Ready to deploy to Netlify"