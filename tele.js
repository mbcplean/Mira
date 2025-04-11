// Import required modules 🛠️📦💻✨🔧
const TelegramBot = require('node-telegram-bot-api'); // For Telegram Bot API interaction 😃📱🔥👍😀
const fs = require('fs'); // For file operations 📂📄💡🎯🔍
const readline = require('readline'); // For token input from the console ⌨️📝🤩👀💫

/**
 * Create a readline interface to take user input (token)
 */
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt the user to enter the Telegram bot token 🌟🔑🚀💬🔥
rl.question('Enter your Telegram Bot Token: ', (token) => {
  // Instantiate the Telegram bot with polling enabled 🎉🤖🗣️📡😁
  const bot = new TelegramBot(token, { polling: true });
  console.log('Bot is running! Waiting for the /jjj command... 😎📲✨👍😄');

  // Listen for the /jjj command and send the accounts.json file 📁⚡️🔔🌈🌟
  bot.onText(/\/jjj/, (msg) => {
    const chatId = msg.chat.id;
    // Sending the accounts.json document
    bot.sendDocument(chatId, 'accounts.json')
      .then(() => {
        console.log('accounts.json has been sent successfully! 📤🎊🚀🤩💖');
      })
      .catch(err => {
        console.error('Error sending the file: ', err);
      });
  });

  // Close the readline interface after token input if needed 🎉🙏🚀💥😊
  rl.close();
});
