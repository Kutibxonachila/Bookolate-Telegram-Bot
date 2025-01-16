import { Composer } from "telegraf"; // For modular commands
import axios from "axios";
import "dotenv/config";

const searchCommand = new Composer();

// Helper function to send the search request
const fetchBooks = async (query) => {
  try {
    const apiUrl = `${process.env.API_URL}/book/books`; // API URL to search books by title
    console.log(`Sending GET request to: ${apiUrl} with query: ${query}`); // Log the API request

    // Sending request to the API
    const response = await axios.get(apiUrl, { params: { title: query } });
    console.log("API Response:", response.data); // Log the response

    return response.data; // Return the response data
  } catch (error) {
    console.error("Error during search request:", error.message); // Log error details
    throw new Error(
      "⚠️ An error occurred while fetching the results. Please try again."
    );
  }
};

// Handler for /search command
searchCommand.command("search", async (ctx) => {
  try {
    // Ask user for input
    await ctx.reply("🔍 Please enter the book title to search:");

    // Initialize session if not already initialized
    if (!ctx.session) {
      ctx.session = {};
    }
    ctx.session.isWaitingForSearchInput = true;
  } catch (error) {
    console.error("Error in /search command:", error);
    await ctx.reply("⚠️ Something went wrong. Please try again.");
  }
});

// Global listener for user input
searchCommand.on("text", async (ctx) => {
  if (ctx.session?.isWaitingForSearchInput) {
    // Reset session state
    ctx.session.isWaitingForSearchInput = false;

    const query = ctx.message.text.trim();
    if (!query) {
      await ctx.reply("❌ You need to provide a valid book title.");
      return;
    }

    // Notify user that search is ongoing
    const loadingMessage = await ctx.reply(
      "🔄 Searching for books... Please wait."
    );

    try {
      console.log(`Searching for books with title: ${query}`); // Log the search query
      // Fetch books by query
      const books = await fetchBooks(query);

      if (books.length > 0) {
        // Create a formatted list of books
        const bookList = books.map((book) => `📚 ${book.title}`).join("\n");

        // Edit loading message to show results
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          loadingMessage.message_id,
          null,
          `🔎 Search results for "${query}":\n\n${bookList}`
        );
      } else {
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          loadingMessage.message_id,
          null,
          `❌ No results found for "${query}".`
        );
      }
    } catch (error) {
      console.error("Error during search:", error);
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        loadingMessage.message_id,
        null,
        error.message // Send the error message
      );
    }
  }
});

export default searchCommand;
