// Cloudflare Workers environment type augmentation
// For OpenNext Cloudflare Workers

interface CloudflareEnv {
  DB: D1Database
  ASSETS: Fetcher
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DB?: D1Database
    }
  }
}

export {}
