/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [],
  },
  images: {
    // AVIF y WebP: la misma imagen pesa entre un 30 y un 50 % menos que en PNG
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      // Fotos de perfil de quien entra con Google
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    // Una foto de perfil no necesita mas de 96 px; asi no se generan tamanos inutiles
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 2_678_400, // 31 dias
  },
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
