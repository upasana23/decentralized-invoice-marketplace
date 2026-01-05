/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {},
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
  webpack: (config, { webpack }) => {
    // Exclude test files and non-code files from node_modules
    config.plugins.push(
      new webpack.IgnorePlugin({
        checkResource(resource, context) {
          // Ignore test files from thread-stream
          if (context.includes('thread-stream') && (resource.includes('test') || resource.includes('bench'))) {
            return true;
          }
          // Ignore test files in node_modules
          if (context.includes('node_modules') && (resource.includes('/test/') || resource.includes('\\.test\\.') || resource.includes('\\.spec\\.'))) {
            return true;
          }
          // Ignore LICENSE and other non-code files
          if (context.includes('node_modules') && (resource.endsWith('.LICENSE') || resource.endsWith('.md') || resource.endsWith('.txt'))) {
            return true;
          }
          return false;
        },
      })
    );

    // Ignore optional dependencies that aren't needed for web builds
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@react-native-async-storage\/async-storage$/,
      })
    );
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^pino-pretty$/,
      })
    );

    // Add fallbacks for Node.js modules that aren't available in browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
    };

    return config;
  },
}

export default nextConfig
