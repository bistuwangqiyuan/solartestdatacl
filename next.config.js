/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    
    // Image optimization
    images: {
        domains: ['zzyueuweeoakopuuwfau.supabase.co'],
        unoptimized: true, // Disable image optimization for static export
    },
    
    // Environment variables validation
    env: {
        NEXT_PUBLIC_APP_NAME: 'Solar PV Testing System',
        NEXT_PUBLIC_APP_VERSION: '1.0.0',
    },
};

module.exports = nextConfig;
