/** @type {import('next').NextConfig} */

const nextConfig= {
    serverComponentsExternalPackages: ['@meshsdk/core', '@meshsdk/core-cst'],
    webpack: (config) => {
        config.experiments = {
            ...config.experiments,
            asyncWebAssembly: true,
        }
        return config
    }
};

export default nextConfig;