import { UserRepository } from "../database/repositories/user.repository.ts";
import { TelegramService } from "../services/telegram.service.ts";
import { ImageUploadService } from "../services/image-upload.service.ts";
import { SubscriptionService } from "../services/subscription.service.ts";
import { 
  USE_DB, 
  WELCOME_IMAGE_URL, 
  DEVELOPER_ID,
  CLEAN_USERNAME
} from "../config/config.ts";

export const BotController = {
  async handleUpdate(update: any): Promise<Response> {
    if (!update.message) return new Response("OK");

    const { chat, from, text, photo, document } = update.message;
    const chatId = chat.id;
    const userId = from.id;

    try {
      if (text === "/start") {
        if (USE_DB) await UserRepository.createUser(userId);
        
        await TelegramService.sendPhoto(
          chatId,
          WELCOME_IMAGE_URL,
          `<b>🖍️ Welcome to Image Link Bot!</b>\n\n` +
          `<i>Send me an image (as photo or file) to get a shareable link</i>`,
          {
            inline_keyboard: [
              [{ 
                text: "Developer 🎾", 
                url: `tg://user?id=${DEVELOPER_ID}`
              }],
              [{
                text: "Join Channel 📢",
                url: `https://t.me/${CLEAN_USERNAME}`
              }],
              [{ 
                text: "Source Code ↗️", 
                url: `https://github.com/Private-Bots-Official/Image-Uploader-Bot`
              }],
            ]
          }
        );
        return new Response("OK");
      }

      if (text === "/users") {
        const responseText = USE_DB
          ? `Total users: ${(await UserRepository.getAllUsers()).length}`
          : "📊 Database not configured";
        await TelegramService.sendMessage(chatId, responseText);
        return new Response("OK");
      }

      // Handle both photos and document-based images
      if (photo || (document?.mime_type?.startsWith('image/'))) {
        const hasAccess = await SubscriptionService.checkSubscription(chatId);
        if (!hasAccess) {
          await TelegramService.sendMessage(
            chatId,
            `<b>🔒 Premium Feature</b>\n\n` +
            `Join our channel to unlock this feature!\n\n` +
            `<a href="https://t.me/${CLEAN_USERNAME}">👉 Click here to join</a>`,
            { disable_web_page_preview: true }
          );
          return new Response("OK");
        }

        let fileId: string;
        if (photo) {
          fileId = photo.pop().file_id;
        } else {
          fileId = document.file_id;
        }

        const imageUrl = await ImageUploadService.uploadImage(
          await (await fetch(await TelegramService.getFileUrl(fileId))).arrayBuffer()
        );

        await TelegramService.sendMessage(
          chatId, 
          imageUrl || "❌ Failed to upload image",
          {
            reply_markup: imageUrl ? {
              inline_keyboard: [
                [{ 
                  text: "Copy Link 🔗", 
                  copy_text: {text: `${encodeURIComponent(imageUrl)}`}
                }],
                [{ 
                  text: "Share Link 🔗", 
                  url: `tg://msg_url?url=${encodeURIComponent(imageUrl)}`
                }],
                [{ 
                  text: "Source Code ↗️", 
                  url: `https://github.com/Private-Bots-Official/Image-Uploader-Bot`
                }],
              ]
            } : undefined
          }
        );
        return new Response("OK");
      }

      if (document) {
        await TelegramService.sendMessage(
          chatId,
          "❌ Unsupported file type. Please send an image file (JPEG, PNG, etc.)"
        );
        return new Response("OK");
      }

      await TelegramService.sendMessage(
        chatId,
        "📸 Send me an image (as photo or file) to get started!\n\n" +
        "✨ Features:\n" +
        "- Convert images to direct links\n" +
        "- Shareable links\n" +
        "- Premium channel access",
      );
    } catch (error) {
      console.error("Handler error:", error);
      await TelegramService.sendMessage(
        chatId,
        "⚠️ Oops! Something went wrong. Please try again."
      );
    }

    return new Response("OK");
  }
};
