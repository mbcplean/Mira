const axios = require('axios');
const fs = require('fs');
const readline = require('readline');
const TelegramBot = require('node-telegram-bot-api');

// ==================== Color Setup for Console (Unique, Bright Colors) ==================== //
const COLORS = {
  info: "\x1b[36m",      // cyan for info
  success: "\x1b[32m",   // green for success
  warning: "\x1b[33m",   // yellow for warnings
  error: "\x1b[31m",     // red for errors
  question: "\x1b[35m",  // magenta for questions
  reset: "\x1b[0m"       // reset
};

const BORDER_TOP = "╔══════════════════════════════════════╗";
const BORDER_BOTTOM = "╚══════════════════════════════════════╝";

// Unique styled log functions for console
function logInfo(message) {
  console.log(COLORS.info + BORDER_TOP);
  console.log("║ " + message);
  console.log(BORDER_BOTTOM + COLORS.reset);
}

function logSuccess(message) {
  console.log(COLORS.success + BORDER_TOP);
  console.log("║ " + message);
  console.log(BORDER_BOTTOM + COLORS.reset);
}

function logWarning(message) {
  console.log(COLORS.warning + BORDER_TOP);
  console.log("║ " + message);
  console.log(BORDER_BOTTOM + COLORS.reset);
}

function logError(message) {
  console.log(COLORS.error + BORDER_TOP);
  console.log("║ " + message);
  console.log(BORDER_BOTTOM + COLORS.reset);
}

function logQuestion(message) {
  console.log(COLORS.question + BORDER_TOP);
  console.log("║ " + message);
  console.log(BORDER_BOTTOM + COLORS.reset);
}

// ==================== API Headers ==================== //
const headers = {
  'user-agent': 'Dart/3.6 (dart:io)',
  'accept-encoding': 'gzip',
  'host': 'api.airdroptoken.com',
  'accept': '*/*',
  'content-type': 'application/json'
};

const firebaseHeaders = {
  'Content-Type': 'application/json',
  'X-Android-Package': 'com.lumira_mobile',
  'X-Android-Cert': '1A1F179100AAF62649EAD01C6870FDE2510B1BC2',
  'Accept-Language': 'en-US',
  'X-Client-Version': 'Android/Fallback/X22003001/FirebaseCore-Android',
  'X-Firebase-GMPID': '1:599727959790:android:5c819be0c7e7e3057a4dff',
  'X-Firebase-Client': 'H4sIAAAAAAAAAKtWykhNLCpJSk0sKVayio7VUSpLLSrOzM9TslIyUqoFAFyivEQfAAAA',
  'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 7.1.2; ASUS_Z01QD Build/N2G48H)',
  'Host': 'www.googleapis.com',
  'Connection': 'Keep-Alive',
  'Accept-Encoding': 'gzip'
};

// ==================== Utility Functions ==================== //

// Generate a random alphanumeric string
function generateRandomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate a random birthday between 1980 and 2005
function generateRandomBirthday() {
  const start = new Date(1980, 0, 1);
  const end = new Date(2005, 11, 31);
  const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  const year = randomDate.getFullYear();
  const month = String(randomDate.getMonth() + 1).padStart(2, '0');
  const day = String(randomDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Random sleep between 1 to 4 seconds
function randomSleep() {
  const min = 1000, max = 4000;
  return sleep(Math.floor(Math.random() * (max - min + 1)) + min);
}

// ==================== Username Handling ==================== //
// Get next username from usernames.txt (one per line) and remove it from file.
function getNextUsername() {
  const filename = 'usernames.txt';
  if (!fs.existsSync(filename)) {
    throw new Error("usernames.txt not found");
  }
  const data = fs.readFileSync(filename, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '');
  if (data.length === 0) {
    throw new Error("No more usernames available in usernames.txt");
  }
  const nextUsername = data.shift();
  fs.writeFileSync(filename, data.join('\n'));
  return nextUsername;
}

// ==================== Account Generation & API Interaction ==================== //

// Generate account data using referral code from code.txt and a username from usernames.txt
function generateAccountData() {
  const username = getNextUsername();
  const randomSuffix = generateRandomString(4); // for email/password uniqueness
  const referralCode = fs.readFileSync('code.txt', 'utf8').trim();
  return {
    full_name: username,
    username: username,
    email: `${username}${randomSuffix}@gmail.com`,
    password: `Pass${randomSuffix}123`,
    phone: `+628${Math.floor(100000000 + Math.random() * 900000000)}`,
    referral_code: referralCode,
    country: 'ID',
    birthday: generateRandomBirthday()
  };
}

// Check email availability
async function checkEmail(email) {
  try {
    const response = await axios.get(
      `https://api.airdroptoken.com/user/email-in-use?email=${encodeURIComponent(email)}`,
      { headers }
    );
    return !response.data.in_use;
  } catch (err) {
    logError('Error checking email: ' + err.message);
    return false;
  }
}

// Check username availability
async function checkUsername(username) {
  try {
    const response = await axios.get(
      `https://api.airdroptoken.com/user/username-in-use?username=${username}`,
      { headers }
    );
    return !response.data.in_use;
  } catch (err) {
    logError('Error checking username: ' + err.message);
    return false;
  }
}

// Login using email and password
async function login(email, password) {
  try {
    const payload = { email, password, returnSecureToken: true, clientType: 'CLIENT_TYPE_ANDROID' };
    const response = await axios.post(
      'https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=AIzaSyB0YXNLWl-mPWQNX-tvd7rp-HVNr_GhAmk',
      payload,
      { headers: firebaseHeaders }
    );
    return response.data.idToken;
  } catch (err) {
    logError('Login failed: ' + (err.response?.data?.error?.message || err.message));
    return null;
  }
}

// Start mining (enable miner and disable ads)
async function startMining(token) {
  try {
    await axios.put(
      'https://api.airdroptoken.com/miners/miner',
      {},
      { headers: { ...headers, 'authorization': `Bearer ${token}`, 'content-length': 0 } }
    );
    await axios.put(
      'https://api.airdroptoken.com/user/ads',
      'ads_enabled=false',
      { headers: { ...headers, 'authorization': `Bearer ${token}`, 'content-type': 'application/x-www-form-urlencoded; charset=utf-8', 'content-length': '17' } }
    );
    return true;
  } catch (err) {
    logError('Error starting mining: ' + err.message);
    return false;
  }
}

// ==================== Telegram Bot Integration ==================== //

let tgBot;
let adminId;
let progressMessageId = null;

// Initialize Telegram bot using token and admin ID from tg.txt (first line: token, second line: admin ID)
function initTelegram() {
  const filename = 'tg.txt';
  if (!fs.existsSync(filename)) {
    throw new Error("tg.txt not found");
  }
  const data = fs.readFileSync(filename, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '');
  if (data.length < 2) {
    throw new Error("tg.txt must contain at least two lines: token and admin ID");
  }
  const token = data[0];
  adminId = data[1];
  tgBot = new TelegramBot(token, { polling: false });
}

// Update progress via Telegram using inline message (edits message if exists, otherwise sends new)
async function updateTelegramProgress(message) {
  try {
    if (progressMessageId === null) {
      const sent = await tgBot.sendMessage(adminId, message, { reply_markup: { inline_keyboard: [] } });
      progressMessageId = sent.message_id;
    } else {
      await tgBot.editMessageText(message, { chat_id: adminId, message_id: progressMessageId, reply_markup: { inline_keyboard: [] } });
    }
  } catch (err) {
    // If editing fails, send a new message and update progressMessageId.
    const sent = await tgBot.sendMessage(adminId, message, { reply_markup: { inline_keyboard: [] } });
    progressMessageId = sent.message_id;
  }
}

// Send error logs via Telegram as a separate message (plain text)
async function sendTelegramError(message) {
  try {
    await tgBot.sendMessage(adminId, "Error: " + message);
  } catch (err) {
    // silently ignore Telegram errors here
  }
}

// ==================== File Operations ==================== //
// Save account data to accounts.json immediately after each new account creation.
function saveToFile(accounts) {
  fs.writeFileSync('accounts.json', JSON.stringify(accounts, null, 2));
  logSuccess("Accounts data saved to accounts.json");
}

// Load accounts from accounts.json (if exists)
function loadExistingAccounts() {
  let accounts = [];
  if (fs.existsSync('accounts.json')) {
    try {
      const content = fs.readFileSync('accounts.json', 'utf8').trim();
      accounts = content ? JSON.parse(content) : [];
      logInfo(`Loaded ${accounts.length} account(s) from accounts.json`);
    } catch (err) {
      logError("Error reading accounts.json: " + err.message);
      accounts = [];
    }
  } else {
    logWarning("accounts.json not found. Starting with an empty accounts array.");
  }
  return accounts;
}

// ==================== Account Registration ==================== //
// Register an account via API
async function registerAccount(accountData) {
  try {
    const [emailOk, usernameOk] = await Promise.all([
      checkEmail(accountData.email),
      checkUsername(accountData.username)
    ]);
    if (!emailOk || !usernameOk) {
      throw new Error('Email or username already in use');
    }
    const response = await axios.post(
      'https://api.airdroptoken.com/user/register',
      accountData,
      { headers: { ...headers, 'authorization': 'Bearer null', 'content-length': JSON.stringify(accountData).length } }
    );
    return { success: true, data: accountData, response: response.data };
  } catch (err) {
    return { success: false, error: err.message, data: accountData };
  }
}

// ==================== Account Creation ==================== //
// Create new accounts (without starting mining) and save after each successful creation.
// Shows progress: Total saved accounts and current batch progress.
async function createNewAccounts(numberToCreate) {
  let accounts = loadExistingAccounts();
  const initialCount = accounts.length;
  let created = 0;
  while (created < numberToCreate) {
    const currentIndex = initialCount + created + 1;
    logInfo(`Total saved accounts: ${initialCount + created}`);
    logInfo(`Creating account ${created + 1} of ${numberToCreate}...`);
    let accountData;
    try {
      accountData = generateAccountData();
    } catch (err) {
      logError(err.message);
      await sendTelegramError(err.message);
      break;
    }
    const result = await registerAccount(accountData);
    if (result.success) {
      logSuccess(`Account created: ${accountData.email}`);
      const token = await login(accountData.email, accountData.password);
      if (token) {
        accounts.push({
          email: accountData.email,
          username: accountData.username,
          password: accountData.password,
          phone: accountData.phone,
          birthday: accountData.birthday,
          token: token,
          mining_status: 'inactive',
          created_at: new Date().toISOString()
        });
        created++;
        saveToFile(accounts);
      } else {
        const errMsg = `Failed login for ${accountData.email}. Retrying...`;
        logError(errMsg);
        await sendTelegramError(errMsg);
      }
    } else {
      const errMsg = `Account creation failed: ${result.error}. Retrying...`;
      logError(errMsg);
      await sendTelegramError(errMsg);
    }
    await randomSleep();
  }
  return accounts;
}

// ==================== Mining Cycle ==================== //
// Run mining cycle for all accounts: re-login and start mining.
// Sends progress updates to admin via Telegram inline message.
async function runMiningCycle(accounts) {
  // Send initial progress update (plain text)
  await updateTelegramProgress(`Starting mining cycle for ${accounts.length} accounts...`);
  logInfo("Starting mining cycle for all accounts...");
  for (let i = 0; i < accounts.length; i++) {
    const acc = accounts[i];
    const progressText = `Processing account ${i + 1} of ${accounts.length}: ${acc.email}`;
    await updateTelegramProgress(progressText);
    logInfo(`Processing ${acc.email}...`);
    const newToken = await login(acc.email, acc.password);
    if (newToken) {
      acc.token = newToken;
      const miningStarted = await startMining(newToken);
      if (miningStarted) {
        logSuccess(`Mining started for ${acc.email}`);
      } else {
        logError(`Mining failed for ${acc.email}`);
        await sendTelegramError(`Mining failed for ${acc.email}`);
      }
    } else {
      logError(`Could not re-login for ${acc.email}`);
      await sendTelegramError(`Could not re-login for ${acc.email}`);
    }
  }
  saveToFile(accounts);
  await updateTelegramProgress("Mining cycle completed!");
  logSuccess("Mining cycle completed!");
}

// ==================== User Input via Readline ==================== //
function askQuestion(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans); }));
}

// ==================== Main Function ==================== //
async function main() {
  logQuestion("What do you want?");
  logQuestion("1: Create new accounts (without starting mining)");
  logQuestion("2: Start mining for saved accounts in accounts.json");

  const choice = await askQuestion("Enter 1 or 2: ");
  if (choice.trim() === "1") {
    const numInput = await askQuestion("How many new accounts do you want to create? ");
    const num = parseInt(numInput.trim(), 10);
    if (isNaN(num) || num <= 0) {
      logError("Invalid number entered. Exiting.");
      return;
    }
    await createNewAccounts(num);
    logSuccess("New accounts created and saved successfully.");
  } else if (choice.trim() === "2") {
    const accounts = loadExistingAccounts();
    if (accounts.length === 0) {
      logWarning("No accounts found in accounts.json. Please create new accounts first.");
      return;
    }
    // Initialize Telegram bot if not already initialized.
    try {
      initTelegram();
    } catch (err) {
      logError("Telegram init error: " + err.message);
      return;
    }
    // Start mining cycle and automatically repeat every 24 hours and 5 minutes.
    while (true) {
      await runMiningCycle(accounts);
      logInfo("Mining cycle completed. Waiting for 24 hours and 5 minutes before starting again...");
      await sleep(86700000); // 24 hours and 5 minutes in ms (86,700,000)
    }
  } else {
    logError("Invalid choice. Exiting.");
  }
  logInfo("Exiting after completing the operation. See you tomorrow!");
}

main().catch(err => {
  logError("An error occurred: " + err.message);
  if (tgBot && adminId) {
    tgBot.sendMessage(adminId, "Error occurred: " + err.message);
  }
});
