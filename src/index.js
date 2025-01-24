import { session, Telegraf } from "telegraf";
import "dotenv/config";
import startCommand from "./commands/start.js";
import helpCommand from "./commands/help.js";
import searchCommand from "./commands/search.js";
import {
  fallbackHandler,
  handleGenderStep,
  registerHandler,
} from "./commands/register.js";
import { listCommand } from "./commands/list.js";
import { loginCommand } from "./commands/login.js";
// import { handleBorrowCallback } from "./commands/list.js";

// Ensure BOT_TOKEN is defined in the .env file
if (!process.env.BOT_TOKEN) {
  console.error(
    "❌ Bot token is missing! Please define BOT_TOKEN in your .env file."
  );
  process.exit(1);
}

// Initialize the bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Enable session middleware
bot.use(session({ ttl: 10 * 60 })); // Session TTL: 10 minutes

// Debugging middleware: Log incoming updates
bot.use((ctx, next) => {
  console.log(`Received update: ${JSON.stringify(ctx.update)}`);
  return next();
});

// Command Handlers
bot.start(startCommand);
bot.help(helpCommand);
bot.command("search", searchCommand);
bot.command("list", listCommand);
bot.command("login", loginCommand);
bot.command("register", registerHandler);

bot.on("message", fallbackHandler);
// Handle callback query for gender selection
bot.on("callback_query", async (ctx) => {
  const callbackData = ctx.callbackQuery.data;
  const userId = ctx.from.id;

  if (callbackData === "gender_male" || callbackData === "gender_female") {
    await handleGenderStep(ctx, userId);
  }
});

// Handle unknown commands
bot.on("text", (ctx) => {
  const knownCommands = [
    "/start",
    "/help",
    "/search",
    "/list",
    "/register",
    "/login",
  ];
  if (!knownCommands.some((cmd) => ctx.message.text.startsWith(cmd))) {
    ctx.reply(`
❌ Noto'g'ri buyruq! Iltimos, quyidagi buyruqlardan birini yuboring:
- /start: Xush kelibsiz
- /help: Buyruqlar ro'yxati
- /search <book_name>: Kitobni qidirish
- /list: Barcha kitoblar ro'yxati
- /register: Ro'yxatdan o'tish
- /login: Tizimga kirish
    `);
  }
});

// Error handling
bot.catch((err) => {
  console.error("❌ Error in bot:", err);
});

// Start the bot
bot
  .launch()
  .then(() => console.log("✅ Bot started successfully!"))
  .catch((error) => {
    console.error("❌ Bot failed to start. Check your token or settings.");
    process.exit(1);
  });

// Graceful stop on termination signals
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
