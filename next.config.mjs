/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
  // Native .node binaries used by the BullMQ worker (canvas rendering,
  // pdf.js processing) cannot be bundled by webpack. Mark them external
  // so Next.js leaves them to Node.js require() at runtime.
  serverExternalPackages: ["@napi-rs/canvas", "pdfjs-dist", "sharp", "canvas", "bullmq", "ioredis"],

  webpack(config, { isServer }) {
    if (isServer) {
      // Prevent webpack from attempting to process .node binary files.
      // These are loaded by Node.js directly at runtime via serverExternalPackages.
      config.module.rules.push({
        test: /\.node$/,
        use: "node-loader",
        type: "javascript/auto",
      })
    }
    return config
  },
}

export default nextConfig
