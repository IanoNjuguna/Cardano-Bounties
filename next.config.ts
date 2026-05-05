import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "libsodium-wrappers-sumo",
    "@cardano-sdk/crypto",
    "@meshsdk/core-cst",
    "@meshsdk/core",
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias["libsodium-wrappers-sumo"] = path.resolve(
        "node_modules/libsodium-wrappers-sumo/dist/modules-sumo/libsodium-wrappers.js"
      );
    }
    return config;
  },
};

export default nextConfig;