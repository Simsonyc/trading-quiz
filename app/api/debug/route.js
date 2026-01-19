export async function GET() {
  return new Response(
    JSON.stringify({
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "✅ Présente" : "❌ Absente",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
