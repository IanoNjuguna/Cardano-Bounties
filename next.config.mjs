/** @type {import('next').NextConfig} */

const nextConfig= {
    serverExternalPackages: ['@meshsdk/core', '@meshsdk/core-csl'],
    turbopack: {},
    webpack: (config) => {
        config.experiments = {
            ...config.experiments,
            asyncWebAssembly: true,
        }
        config.module.rules.push({
            test: /\.wasm$/,
            type: 'webassembly/async',
        })
        return config
    }
};

export default nextConfig;
