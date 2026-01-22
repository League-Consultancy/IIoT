/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Enable API routes to handle backend
    experimental: {
        serverComponentsExternalPackages: ['mongoose', 'bcryptjs'],
    },
};

module.exports = nextConfig;
