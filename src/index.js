import { session, Telegraf } from "telegraf";
import startCommand from "./commands/start.js";
import "dotenv/config";
import helpCommand from "./commands/help.js";
import searchCommand from "./commands/search.js";
import { borrowBookHandler, listCommand } from "./commands/list.js";

// Ensure BOT_TOKEN is defined in the .env file
if (!process.env.BOT_TOKEN) {
  console.error(
    "Bot token is missing! Please define BOT_TOKEN in your .env file."
  );
  process.exit(1); // Exit the app if the token is not found
}

// Initializing bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Enable session middleware
bot.use(session());

// Register command handlers
bot.start(startCommand);
bot.help(helpCommand);
bot.command("search", searchCommand); // Registering the /search command
bot.command("list", listCommand);
bot.on("callback_query", borrowBookHandler); // Registering the /list command

// // Handle unknown commands
// bot.on("text", (ctx) => {
//   const messageText = ctx.message.text;

//   if (
//     !messageText.startsWith("/start") &&
//     !messageText.startsWith("/help") &&
//     !messageText.startsWith("/search") &&
//     !messageText.startsWith("/new") &&
//     !messageText.startsWith("/recommend") &&
//     !messageText.startsWith("/list")
//   ) {
//     const errorMessage = `
// ❌ Noto'g'ri buyruq! Iltimos, quyidagi buyruqlardan birini yuboring:
// - /start: Xush kelibsiz
// - /help: Buyruqlar ro'yxati
// - /search <book_name>: Kitobni qidirish
// - /new: Yaqinda qo'shilgan kitoblar
// - /recommend: Kitob tavsiyasini oling
// - /list: Barcha kitoblar ro'yxati
//     `;

//     ctx.reply(errorMessage);
//   }
// });

// Error handling
bot.catch((err, ctx) => {
  console.error("Error in bot:", err);
  console.error("Context:", ctx);
});

// Start bot
bot
  .launch()
  .then(() => {
    console.log("Bot started...");
  })
  .catch((error) => {
    console.error("Error starting bot:", error);
    process.exit(1); // Exit the process on failure to launch
  });

// Graceful stop on termination signals
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
