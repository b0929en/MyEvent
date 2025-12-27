import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'obuldwnlmqxsjkvewfcm.supabase.co',
      },
    ],
  },
};

export default nextConfig;
