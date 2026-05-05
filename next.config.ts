import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "libsodium-wrappers-sumo",
    "@cardano-sdk/crypto",
    "@meshsdk/core-cst",
    "@meshsdk/core",
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias["libsodium-wrappers-sumo"] =
        require.resolve("libsodium-wrappers-sumo/dist/modules-sumo/libsodium-wrappers.js");
    }
    return config;
  },
};

export default nextConfig;