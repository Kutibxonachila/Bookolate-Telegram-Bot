const startCommand = (ctx) => {
  ctx.reply(
    "Assalamu alaikum! *Bookolate* ga xush kelibsiz 📚.\n\nBarcha mavjud buyruqlarni ko'rish uchun /help dan foydalaning.",
    { parse_mode: "Markdown" }
  );
};

export default startCommand;
