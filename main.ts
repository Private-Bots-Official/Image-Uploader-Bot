import { serve } from "https://deno.land/std@0.195.0/http/server.ts";
import { BotController } from "./controllers/bot.controller.ts";

serve(async (req) => {
  if (req.method !== "POST") return new Response("Success", { status: 200 });
  try {
    const update = await req.json();
    return await BotController.handleUpdate(update);
  } catch (error) {
    console.error("Server error:", error);
    return new Response("Internal Error", { status: 500 });
  }
});

console.log("Bot server running");