
export async function GET() {
  return new Response(JSON.stringify({ test: 'ok', time: Date.now() }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
