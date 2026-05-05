import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "libsodium-wrappers-sumo",
    "@cardano-sdk/crypto",
    "@meshsdk/core-cst",
    "@meshsdk/core",
  ],
};

export default nextConfig;
