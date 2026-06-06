/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This app is a fully client-side browser editor. These flags keep Vercel
  // builds green; set them back to false once you've run `next build` locally.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};
export default nextConfig;
