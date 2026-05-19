/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@permitpro/shared",
    "@permitpro/ui-web",
    "@permitpro/permit-engine",
    "@permitpro/ai",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
  },
};

module.exports = nextConfig;
