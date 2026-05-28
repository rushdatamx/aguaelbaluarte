import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/demos/purificadora",
        destination: "/",
        permanent: true,
      },
      {
        source: "/demos/purificadora/:path*",
        destination: "/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
