import axios from "axios";
import "dotenv/config";

// Middleware to set and retrieve library user ID
const setLibraryUserId = async (ctx, next) => {
  try {
    const userMessage = ctx.message?.text;

    // Check if the user is setting their library user ID
    if (userMessage?.startsWith("/setid")) {
      const libraryUserId = userMessage.split(" ")[1];
      if (!libraryUserId) {
        await ctx.reply(
          "❌ Iltimos, foydalanuvchi ID-ni kiriting. Misol: /setid 12345"
        );
        return;
      }

      // Save the library user ID (use a database in production)
      ctx.session = ctx.session || {};
      ctx.session.libraryUserId = libraryUserId;

      await ctx.reply(`✅ Foydalanuvchi ID o'rnatildi: ${libraryUserId}`);
      return;
    }

    // If the user is performing other actions, check if ID is set
    if (!ctx.session?.libraryUserId) {
      await ctx.reply(
        "❌ Iltimos, avval /setid orqali foydalanuvchi ID-ni o'rnating."
      );
      return;
    }

    await next(); // Proceed to the next middleware
  } catch (error) {
    console.error("Error in setting library user ID:", error.message);
    await ctx.reply("⚠️ Foydalanuvchi ID-ni o'rnatishda xatolik yuz berdi.");
  }
};

// Command to list books
const listCommand = async (ctx) => {
  try {
    console.log("Command '/list' triggered");

    // Fetch the list of books from the API
    const apiUrl = "https://ishbazar-master-server.onrender.com/book/all_book";
    console.log(`Sending GET request to: ${apiUrl}`);

    const response = await axios.get(apiUrl);
    const books = response.data;

    if (!Array.isArray(books) || books.length === 0) {
      console.log("No books found or invalid response.");
      await ctx.reply("❌ Hech qanday kitob topilmadi.");
      return;
    }

    console.log("Books fetched successfully");

    // Create an inline keyboard for the list of books
    const buttons = books.map((book) => [
      {
        text: `📚 ${book.title} - Muallif: ${book.author}`,
        callback_data: `borrow_${book.id}`, // Unique callback data for each book
      },
    ]);

    // Send the list with buttons
    await ctx.reply("📂 Barcha kitoblar ro'yxati 📖:", {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  } catch (error) {
    console.error("Error occurred while fetching book list:", error.message);
    await ctx.reply(
      "⚠️ Kitoblar ro'yxatini olishda xatolik yuz berdi. Keyinroq qayta urinib ko'ring."
    );
  }
};

export const handleBorrowCallback = async (ctx, callbackQuery) => {
  const callbackData = callbackQuery.data;

  if (callbackData.startsWith("borrow_")) {
    const bookId = callbackData.split("_")[1]; // Get book ID from the callbackData

    // Check if the user is registered before borrowing
    const libraryUserId = ctx.session?.libraryUserId;
    if (!libraryUserId) {
      await ctx.reply(
        "❌ Iltimos, avval /setid orqali foydalanuvchi ID-ni o'rnating."
      );
      return;
    }

    await handleBorrowBook(ctx, callbackData); // Call the borrowing function
  } else if (callbackData === "cancel_borrow") {
    await ctx.reply("❌ Kitob olish bekor qilindi.");
  }
};


const handleBorrowBook = async (ctx, callbackData) => {
  try {
    const libraryUserId = ctx.session?.libraryUserId;

    if (!libraryUserId) {
      await ctx.reply(
        "❌ Iltimos, avval /setid orqali foydalanuvchi ID-ni o'rnating."
      );
      return;
    }

    const bookId = callbackData.split("_")[1]; // Extract the book ID from callbackData

    if (!bookId) {
      await ctx.reply(
        "❌ Noto'g'ri kitob identifikatori. Iltimos, qayta urinib ko'ring."
      );
      return;
    }

    // API URL for borrowing the book
    const apiUrl =
      "https://ishbazar-master-server.onrender.com/borrowing/borrow";
    const payload = { userId: libraryUserId, bookId };

    console.log(`Sending POST request to ${apiUrl} with payload:`, payload);

    const response = await axios.post(apiUrl, payload);

    // Check if the borrowing was successful
    await callbackQuery.message.reply("Kitobni olishni xohlaysizmi?");
    if (response.data.success) {
      await ctx.reply("📚 Kitob muvaffaqiyatli olingan!");
    } else {
      await ctx.reply(`❌ Xatolik: ${response.data.message}`);
    }
  } catch (error) {
    console.error("Error occurred while borrowing book:", error.message);
    await ctx.reply("⚠️ Kitobni olishda xatolik yuz berdi.");
  }
};

export { setLibraryUserId, listCommand };
