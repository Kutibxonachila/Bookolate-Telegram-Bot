export const answerCallbackQuery = async (ctx, message) => {
  try {
    // Answer the callback query with a custom message
    await ctx.answerCallbackQuery({
      text: message, // The message to send
      show_alert: true, // Whether to show an alert pop-up (optional)
    });
  } catch (error) {
    console.error("Error answering callback query:", error.message);
  }
};
