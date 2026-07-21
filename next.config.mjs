/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTE: `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` were
  // both enabled here. They silence every type and lint error at build time,
  // which defeats the purpose of using TypeScript at all. Removed deliberately.
  images: {
    unoptimized: true,
  },
}

export default nextConfig
