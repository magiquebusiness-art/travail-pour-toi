// Cloudflare Workers environment type augmentation
// This extends the CloudflareEnv interface from @cloudflare/next-on-pages
// with the bindings defined in wrangler.toml

interface CloudflareEnv {
  DB: {
    prepare(query: string): {
      bind(...values: unknown[]): {
        first<T = unknown>(): Promise<T | null>
        all<T = unknown>(): Promise<{ results: T[] }>
        run(): Promise<void>
      }
    }
  }
  KV: KVNamespace
  ASSETS: Fetcher
}
