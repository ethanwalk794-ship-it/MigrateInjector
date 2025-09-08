/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable SWC minification for faster builds
  swcMinify: true,
  
  // External packages for server-side
  serverExternalPackages: ['mongoose', 'bullmq', 'ioredis', 'mammoth'],
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Experimental features for performance
  experimental: {
    optimizeCss: true,
    serverComponentsExternalPackages: ['mammoth'],
  },
  
  // Optimized images
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // 1 day
  },
  
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  webpack: (config, { isServer, dev }) => {
    // Development optimizations
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules/**', '**/.next/**'],
      };
      // Faster source maps in development
      config.devtool = 'eval-cheap-module-source-map';
    } else {
      // Production bundle splitting for better caching
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            mui: {
              test: /[\\/]node_modules[\\/]@mui[\\/]/,
              name: 'mui',
              chunks: 'all',
              priority: 20,
            },
          },
        },
      };
    }
    
    // Handle file uploads and document processing
    config.module.rules.push({
      test: /\.(docx|pdf)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/files/',
          outputPath: 'static/files/',
        },
      },
    });

    // Handle Node.js modules in client-side code
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        stream: false,
        util: false,
      };
    }
    
    // Optimize imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@mui/material': '@mui/material',
      '@mui/icons-material': '@mui/icons-material',
    };

    return config;
  },
  // File upload size limit
  serverRuntimeConfig: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  
  // Build optimizations
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Optimize imports to reduce bundle size
  modularizeImports: {
    '@mui/material': {
      transform: '@mui/material/{{member}}',
    },
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
  },
  // Headers (CORS for API + global security headers)
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
