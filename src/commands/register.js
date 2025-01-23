import { Markup } from "telegraf";
import axios from "axios";

// Helper function to initialize session data
export const initializeRegistrationSession = (ctx, userId) => {
  if (!ctx.session.registrationData) {
    ctx.session.registrationData = {}; // Initialize registrationData if it doesn't exist
  }

  if (!ctx.session.registrationData[userId]) {
    ctx.session.registrationData[userId] = { step: "contact" }; // Start with contact step
  }
};

// Helper function to handle the contact step
export const handleContactStep = async (ctx, userId) => {
  const contact = ctx.message?.contact;
  if (contact && contact.phone_number) {
    ctx.session.registrationData[userId].phone = contact.phone_number;
    ctx.session.registrationData[userId].firstName = contact.first_name;
    ctx.session.registrationData[userId].lastName = contact.last_name;
    ctx.session.registrationData[userId].step = "gender";

    await ctx.reply(
      "👤 Iltimos, jinsingizni tanlang:",
      Markup.inlineKeyboard([
        Markup.button.callback("Erkak", "gender_male"),
        Markup.button.callback("Ayol", "gender_female"),
      ])
    );
  } else {
    await ctx.reply(
      "📱 Iltimos, telefon raqamingizni ulashing:",
      Markup.keyboard([Markup.button.contactRequest("📲 Share Contact")])
        .oneTime()
        .resize()
    );
  }
};

// Helper function to handle the gender step
export const handleGenderCallback = async (ctx) => {
  const data = ctx.callbackQuery.data; // Retrieve callback data

  if (data === "gender_male") {
    await ctx.reply("Siz erkak jinsini tanladingiz.");
  } else if (data === "gender_female") {
    await ctx.reply("Siz ayol jinsini tanladingiz.");
  } else {
    await ctx.reply("❌ Noto'g'ri jinsni tanlash.");
  }

  // Example: Proceed to the next registration step if necessary
};

// Helper function to handle the password step
export const handlePasswordStep = async (ctx, userId, message) => {
  if (message && message.length >= 6) {
    ctx.session.registrationData[userId].password = message;
    const payload = {
      first_name: ctx.session.registrationData[userId].firstName,
      last_name: ctx.session.registrationData[userId].lastName,
      phone: ctx.session.registrationData[userId].phone,
      password: ctx.session.registrationData[userId].password,
      gender: ctx.session.registrationData[userId].gender,
    };

    try {
      const response = await axios.post(
        "https://ishbazar-master-server.onrender.com/auth/register",
        payload
      );

      if (response.status === 200) {
        await ctx.reply("✅ Ro'yxatdan muvaffaqiyatli o'tdingiz!");
      } else {
        await ctx.reply(
          `❌ Ro'yxatdan o'tishda xatolik yuz berdi: ${response.data.message}`
        );
      }
    } catch (error) {
      console.error("API Error:", error.message);
      await ctx.reply("⚠️ API bilan ulanishda xatolik yuz berdi.");
    }

    delete ctx.session.registrationData[userId]; // Clear session after registration
  } else {
    await ctx.reply(
      "❌ Parol kamida 6 ta belgidan iborat bo'lishi kerak. Iltimos, qayta kiriting:"
    );
  }
};

// Main handler function
export const registerHandler = async (ctx) => {
  const userId = ctx.from.id;

  // Initialize registration session for the user
  initializeRegistrationSession(ctx, userId);

  const { step } = ctx.session.registrationData[userId];
  const message = ctx.message?.text?.trim();

  try {
    switch (step) {
      case "contact":
        await handleContactStep(ctx, userId);
        break;

      case "gender":
        await handleGenderStep(ctx, userId, message);
        break;

      case "password":
        await handlePasswordStep(ctx, userId, message);
        break;

      default:
        await ctx.reply("❌ Noto'g'ri buyruq. Qayta urinib ko'ring.");
        break;
    }
  } catch (error) {
    console.error("Error in registerHandler:", error.message);
    await ctx.reply("⚠️ Ro'yxatdan o'tishda xatolik yuz berdi.");
  }
};
