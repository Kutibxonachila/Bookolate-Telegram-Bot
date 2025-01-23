import { session, Telegraf } from "telegraf";
import startCommand from "./commands/start.js";
import "dotenv/config";
import helpCommand from "./commands/help.js";
import searchCommand from "./commands/search.js";
import { handleGenderCallback, registerHandler } from "./commands/register.js";
import { handleBorrowCallback, listCommand } from "./commands/list.js";
import { loginCommand } from "./commands/login.js";
import { answerCallbackQuery } from "./query/answer.js";
import { SocksProxyAgent } from "socks-proxy-agent"; // Optional for proxy

// Ensure BOT_TOKEN is defined in the .env file
if (!process.env.BOT_TOKEN) {
  console.error(
    "❌ Bot token is missing! Please define BOT_TOKEN in your .env file."
  );
  process.exit(1); // Exit the app if the token is not found
}

console.log("BOT_TOKEN:", process.env.BOT_TOKEN); // Debugging token loading

// Optional: Add a proxy if required (comment out if not needed)
const proxyAgent = process.env.PROXY_URL
  ? new SocksProxyAgent(process.env.PROXY_URL)
  : null;

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN, {
  telegram: { agent: proxyAgent },
});

// Enable session middleware
bot.use(session({ ttl: 10 * 60 })); // Set session TTL to 10 minutes

// Debugging middleware: Log incoming updates
bot.use((ctx, next) => {
  console.log(`Update type: ${ctx.updateType}`);
  return next();
});

// Register command handlers
bot.start(startCommand);
bot.help(helpCommand);
bot.command("search", searchCommand); // Register the /search command
bot.command("list", listCommand);
bot.command("login", loginCommand);
bot.command("register", registerHandler);

// Centralized callback query handler
bot.on("callback_query", async (ctx) => {
  try {
    const callbackQuery = ctx.callbackQuery;
    const data = callbackQuery?.data;

    if (!data) {
      await ctx.answerCallbackQuery({
        text: "❌ Noma'lum callback ma'lumotlari.",
        show_alert: true,
      });
      return;
    }

    // Handle gender-related callbacks
    if (data.startsWith("gender_")) {
      await handleGenderCallback(ctx); // Pass context
      return;
    }

    // Handle borrowing a book
    if (data.startsWith("borrow_")) {
      await handleBorrowCallback(ctx, callbackQuery); // Pass the full context and callbackQuery
      return;
    }

    // Default case for unrecognized callback
    await ctx.answerCallbackQuery({
      text: "❌ Noma'lum callback.",
      show_alert: true,
    });
  } catch (error) {
    console.error("Error handling callback query:", error.message);
    await ctx.answerCallbackQuery({
      text: "⚠️ Callbackni qayta ishlashda xatolik yuz berdi.",
      show_alert: true,
    });
  }
});

// Handle inline keyboard callbacks

// Handlers for /register and /login commands
bot.on("text", (ctx) => {
  const userId = ctx.from.id;

  // Check if the user is registering or logging in based on session
  if (ctx.session.registrationData && !ctx.session.loginData) {
    registerHandler(ctx); // User is in the registration process
  } else if (ctx.session.loginData) {
    loginHandler(ctx); // User is in the login process
  } else {
    ctx.reply("⚠️ Iltimos, avval ro'yxatdan o'ting yoki tizimga kiring.");
  }
});

// Handle contact sharing for registration
bot.on("contact", (ctx) => {
  if (ctx.session.registrationData && !ctx.session.loginData) {
    registerHandler(ctx); // Proceed with registration when contact is shared
  } else {
    ctx.reply("⚠️ Iltimos, avval ro'yxatdan o'ting.");
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
bot.catch((err, ctx) => {
  console.error("❌ Error in bot:", err);
  if (err.code === "ETIMEDOUT") {
    console.error("⚠️ Network timeout! Check your internet or proxy settings.");
  }
  console.error("Context:", ctx);
});

// Start bot
bot
  .launch()
  .then(() => {
    console.log("✅ Bot started successfully!");
  })
  .catch((error) => {
    console.error(
      "❌ Bot failed to start. Check your network, token, or proxy settings."
    );
    console.error("Error details:", error);
    process.exit(1);
  });

// Graceful stop on termination signals
process.once("SIGINT", () => {
  console.log("👋 Graceful shutdown: SIGINT");
  bot.stop("SIGINT");
});
process.once("SIGTERM", () => {
  console.log("👋 Graceful shutdown: SIGTERM");
  bot.stop("SIGTERM");
});
