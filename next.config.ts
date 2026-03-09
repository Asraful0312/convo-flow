import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tailark.com",
        port: "",
        pathname: "/**", // This allows all paths under this domain
      },
      {
        protocol: "https",
        hostname: "html.tailus.io",
        port: "",
        pathname: "/**", // This allows all paths under this domain
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      // Keep your other patterns here
      {
        protocol: "https",
        hostname: "tailark.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
