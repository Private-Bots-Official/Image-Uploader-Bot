import { serve } from "https://deno.land/std@0.195.0/http/server.ts";
const BotController = await import("./controllers/bot.controller.ts")
  .then(module => module.BotController)
  .catch(err => {
    console.error("⚠️ Critical import error:", err);
    Deno.exit(1);
  });
console.log("✅ BotController loaded successfully");
function handleHealthCheck(req: Request): Response {
  console.log(`ℹ️ Health check: ${req.method} ${req.url}`);
  return new Response("OK", { status: 200 });
}
async function handler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    if (url.pathname === "/health") {
      return handleHealthCheck(req);
    }
    if (req.method === "POST") {
      const update = await req.json();
      return await BotController.handleUpdate(update);
    }
    return new Response("Umm... what?", { status: 200 });
  } catch (err) {
    console.error("⚠️ Handler error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
console.log("🚀 Starting server...");
serve(handler);
console.log("✅ Server running");
