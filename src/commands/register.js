import { Markup } from "telegraf";
import axios from "axios";

// Initialize the registration session
export const initializeRegistrationSession = (ctx, userId) => {
  if (!ctx.session) {
    ctx.session = {};
  }

  if (!ctx.session.registrationData) {
    ctx.session.registrationData = {};
  }

  if (!ctx.session.registrationData[userId]) {
    ctx.session.registrationData[userId] = { step: "phone" }; // Start with phone step
  }

  console.log(
    "Registration session initialized:",
    ctx.session.registrationData[userId]
  );
};

// Handle the "phone" step (contact info)
// Handle the "phone" step
export const handlePhoneStep = async (ctx, userId) => {
  const contact = ctx.message?.contact;

  if (contact && contact.phone_number) {
    ctx.session.registrationData[userId].phone = contact.phone_number;
    ctx.session.registrationData[userId].step = "password"; // Move to password step
    console.log(
      "Session updated with phone:",
      ctx.session.registrationData[userId]
    );
    await ctx.reply("🔒 Parolingizni kiriting:");
  } else {
    console.log("No phone number received.");
    await ctx.reply(
      "📱 Iltimos, telefon raqamingizni ulashing:",
      Markup.keyboard([Markup.button.contactRequest("📲 Share Contact")])
        .oneTime()
        .resize()
    );
  }
};

// Handle the "password" step
export const handlePasswordStep = async (ctx, userId) => {
  const password = ctx.message?.text;

  if (password) {
    ctx.session.registrationData[userId].password = password;
    ctx.session.registrationData[userId].step = "gender"; // Move to gender step
    await ctx.reply(
      "👤 Iltimos, jinsingizni tanlang:",
      Markup.inlineKeyboard([
        [
          Markup.button.callback("Erkak", "gender_male"),
          Markup.button.callback("Ayol", "gender_female"),
        ],
      ])
    );
  } else {
    await ctx.reply("❌ Parolni kiriting.");
  }
};

// Handle the "gender" step
export const handleGenderStep = async (ctx, userId) => {
  if (
    !ctx.session ||
    !ctx.session.registrationData ||
    !ctx.session.registrationData[userId]
  ) {
    console.error("Session data not found for user:", userId);
    return await ctx.reply("❌ Ro'yxatdan o'tishda xatolik yuz berdi.");
  }

  const gender = ctx.callbackQuery?.data;

  console.log("Received gender selection:", gender); // Debugging line

  if (gender) {
    // Add gender to registration data
    ctx.session.registrationData[userId].gender = gender;
    ctx.session.registrationData[userId].step = "completed"; // Registration complete

    // Send the data to API after completion
    await sendDataToAPI(ctx, userId);
  } else {
    await ctx.reply("❌ Jinsni tanlang.");
  }
};

// Post data to the API after registration is complete
const sendDataToAPI = async (ctx, userId) => {
  const registrationData = ctx.session.registrationData[userId];

  // Fetch first name and last name from Telegram user info
  const firstName = ctx.from.first_name;
  const lastName = ctx.from.last_name || "Nouname"; // Last name might be empty

  // Create a new object to send to the API without the 'step' field
  const { step, gender, phone, password } = registrationData; // Extract relevant data

  // Map the gender field to a user-friendly value
  const mappedGender =
    gender === "gender_male"
      ? "Male"
      : gender === "gender_female"
      ? "Female"
      : "";

  // Include first name, last name, and mapped gender in registration data
  const data = {
    first_name: firstName,
    last_name: lastName,
    phone: phone,
    password: password,
    gender: mappedGender, // Use mapped gender value
  };

  console.log("Sending registration data to API:", data);

  try {
    const response = await axios.post(
      "https://ishbazar-master-server.onrender.com/auth/register",
      data
    );

    if (response.status === 201) {
      await ctx.reply("✅ Ro'yxatdan muvaffaqiyatli o'tdingiz!");
    } else {
      await ctx.reply("❌ Ro'yxatdan o'tishda xatolik yuz berdi.");
    }
  } catch (error) {
    console.error("API Error:", error.message);
    await ctx.reply("⚠️ API bilan ulanishda xatolik yuz berdi.");
  }

  // Clear session data after registration
  delete ctx.session.registrationData[userId];
};

// Main registration handler (command "/register")
export const registerHandler = async (ctx) => {
  const userId = ctx.from.id;

  // Initialize registration session for the user
  initializeRegistrationSession(ctx, userId);

  const registrationData = ctx.session.registrationData[userId];

  if (!registrationData) {
    await ctx.reply(
      "❌ Ro'yxatga olish ma'lumotlari yo'q. Iltimos, /register ni bosing."
    );
    return;
  }

  const { step } = registrationData;

  switch (step) {
    case "phone":
      await handlePhoneStep(ctx, userId);
      break;

    case "password":
      await handlePasswordStep(ctx, userId);
      break;

    case "gender":
      await handleGenderStep(ctx, userId);
      break;

    case "completed":
      await ctx.reply("✅ Ro'yxatga olish yakunlandi.");
      break;

    default:
      await ctx.reply("❌ Noto'g'ri buyruq. Qayta urinib ko'ring.");
      break;
  }
};

// Fallback handler for invalid commands when registration is not in progress
export const fallbackHandler = async (ctx) => {
  if (
    !ctx.session ||
    !ctx.session.registrationData ||
    !ctx.session.registrationData[ctx.from.id]
  ) {
    // If the user is not in the registration process, guide them to start the registration process
    await ctx.reply("Iltimos, ro'yxatdan o'tish uchun /register ni bosing.");
  } else {
    // If the user is in the registration flow, proceed with that
    await registerHandler(ctx);
  }
};
