import axios from "axios";

// Store temporary login data
const loginData = {};

export const loginCommand = async (ctx) => {
  try {
    const userId = ctx.from.id;

    // Initialize loginData for the user
    loginData[userId] = {};

    // Ask for phone number
    await ctx.reply("📱 Telefon raqamingizni kiriting:");
    loginData[userId].step = "phone";
  } catch (error) {
    console.error("Error in /login command:", error.message);
    await ctx.reply("⚠️ Kirishda xatolik yuz berdi.");
  }
};

export const loginHandler = async (ctx) => {
  const userId = ctx.from.id;

  if (!loginData[userId]) {
    await ctx.reply(
      "❌ Kirish jarayoni boshlanmadi. Iltimos, /login buyrug'idan foydalaning."
    );
    return;
  }

  const step = loginData[userId].step;
  const message = ctx.message?.text;

  switch (step) {
    case "phone":
      // Check if the phone number is provided
      if (!message) {
        await ctx.reply("❌ Telefon raqamingizni kiriting.");
        return;
      }

      loginData[userId].phone = message;
      loginData[userId].step = "password";
      await ctx.reply("🔑 Parolingizni kiriting:");
      break;

    case "password":
      // Check if the password is provided
      if (!message) {
        await ctx.reply("❌ Parolingizni kiriting.");
        return;
      }

      loginData[userId].password = message;

      // Send data to the API
      const apiUrl = "https://ishbazar-master-server.onrender.com/auth/login";
      const payload = {
        phone: loginData[userId].phone,
        password: loginData[userId].password,
      };

      try {
        const response = await axios.post(apiUrl, payload);

        if (response.status === 200) {
          const { token } = response.data;
          await ctx.reply("✅ Tizimga muvaffaqiyatli kirildi!");
          loginData[userId].token = token;
        } else {
          await ctx.reply(
            `❌ Kirishda xatolik yuz berdi: ${response.data.message}`
          );
        }
      } catch (error) {
        console.error("API Error:", error.message);
        await ctx.reply("⚠️ API ga ulanishda xatolik yuz berdi.");
      }

      // Clear the login data after completion
      delete loginData[userId];
      break;

    default:
      await ctx.reply("❌ Noto'g'ri buyruq. Iltimos, qayta urinib ko'ring.");
  }
};
