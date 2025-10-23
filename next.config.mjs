/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['i.imgur.com', 'res.cloudinary.com'],
  },
  webpack: (config, { isServer }) => {
    // Ignore optional dependencies that cause warnings
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    // Ignore React Native dependencies in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'react-native': false,
        '@react-native-async-storage/async-storage': false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
