/** @type {import('next').NextConfig} */

const nextConfig= {

    // Fix build error
    webpack: (config, { isServer }) => {
        // Enable webAssembly experiments
        config.experiments = {
            ...config.experiments,
            asyncWebAssembly: true,
            layers: true,
        };

        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
            };
        }

        return config;
    },
    serverExternalPackages: ['@meshsdk/core', '@meshsdk/core-cst']
};

export default nextConfig;
