const TelegramBot = require('node-telegram-bot-api');
const mongo = require('mongodb').MongoClient;
const axios = require('axios');
const http = require('http');
let db;

let bot_token = '6311572666:AAGoypJ67kjTKK4ONV3l-ezyf-azljx2ULM';
let bot_name = 'DigiByte_AutoPayV1Bot';
let mongoLink = 'mongodb+srv://snlrckz:sun@cluster0.qvc9tun.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
let payment_channel = '@Boom_Payoutz';
const bot = new TelegramBot(bot_token, { polling: true });

mongo.connect(mongoLink, { useUnifiedTopology: true }, (err, client) => {
  if (err) {
    console.log(err);
  }

  db = client.db(bot_name);
  console.log('🤖 is listening to your commands');
});

const channels = '@RuBiX_Drops';
const admin = '1710551143';
const bot_cur = 'DGB';
const min_wd = '0.10';
const ref_bonus = '100';
const daily_bonus = '1000';
var textt = '*✔️ Dashboard*';
var keybo = [
  ['💰 Account'],
  ['👫 Invite', '🗂 Wallet', '🎁 Bonus'],
  ['💳 Withdraw', '📊 Statistics']
];

// Helper function to generate a random integer
const rndInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const botStart = async (msg) => {
  try {
    const chatId = msg.chat.id;
    if (msg.chat.type != 'private') {
      return;
    }

    let dbData = await db.collection('allUsers').find({ userId: msg.from.id }).toArray();
    let bData = await db.collection('vUsers').find({ userId: msg.from.id }).toArray();

    let q1 = rndInt(1, 10);
    let q2 = rndInt(1, 10);
    let ans = q1 + q2;

    if (bData.length === 0) {
      if (msg.text && msg.text != msg.from.id) {
        let ref = parseInt(msg.text, 10);
        db.collection('pendUsers').insertOne({ userId: msg.from.id, inviter: ref });
      } else {
        db.collection('pendUsers').insertOne({ userId: msg.from.id });
      }

      db.collection('allUsers').insertOne({ userId: msg.from.id, virgin: true, paid: false });
      db.collection('balance').insertOne({ userId: msg.from.id, balance: 0, withdraw: 0 });
      db.collection('checkUsers').insertOne({ userId: msg.from.id, answer: ans });
      bot.sendMessage(
        chatId,
        `*♻️ Please Complete This Captcha To Prove Yourself Human\n\n▶️ Please Answer :* \`${q1}\` + \`${q2}\` = ?\n\n_🔽 Send your Answer Below!!!!_`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [['‼️ Try Again']],
            resize_keyboard: true,
          },
        }
      );
    } else {
      let joinCheck = await findUser(msg);
      if (joinCheck) {
        let pData = await db.collection('pendUsers').find({ userId: msg.from.id }).toArray();
        if ('inviter' in pData[0] && !('referred' in dbData[0])) {
          let bal = await db.collection('balance').find({ userId: pData[0].inviter }).toArray();
          let cal = bal[0].balance * 1;
          let sen = ref_bonus * 1;
          let see = cal + sen;

          bot.sendMessage(pData[0].inviter, `➕ *New Referral on your link* you received ${ref_bonus} ${bot_cur}`, {
            parse_mode: 'Markdown',
          });

          db.collection('allUsers').updateOne(
            { userId: msg.from.id },
            { $set: { inviter: pData[0].inviter, referred: 'surenaa' } },
            { upsert: true }
          );

          db.collection('joinedUsers').insertOne({ userId: msg.from.id, join: true });
          db.collection('balance').updateOne({ userId: pData[0].inviter }, { $set: { balance: see } }, { upsert: true });

          bot.sendMessage(chatId, textt, {
            reply_markup: {
              keyboard: keybo,
              resize_keyboard: true,
            },
            disable_web_page_preview: true,
          });
        } else {
          db.collection('joinedUsers').insertOne({ userId: msg.from.id, join: true });
          bot.sendMessage(chatId, textt, {
            reply_markup: {
              keyboard: keybo,
              resize_keyboard: true,
            },
            disable_web_page_preview: true,
          });
        }
      } else {
        mustJoin(msg);
      }
    }
  } catch (e) {
    sendError(e, msg);
  }
};

bot.onText(/\/start/, botStart);

bot.onText(/⬅️ Back|🔙 back/, botStart);


// Handler for "‼️ Try Again"
bot.onText(/‼️ Try Again/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    let bData = await db.collection('vUsers').find({ userId: msg.from.id }).toArray();

    if (bData.length === 0) {
      let q1 = rndInt(1, 50);
      let q2 = rndInt(1, 50);
      let ans = q1 + q2;

      await db.collection('checkUsers').updateOne({ userId: msg.from.id }, { $set: { answer: ans } }, { upsert: true });

      bot.sendMessage(
        chatId,
        `*♻️ Please Complete This Captcha To Prove Yourself Human\n\n▶️ Please Answer :* \`${q1}\` + \`${q2}\` = ?\n\n_🔽 Send your Answer Below!!!!_`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [['‼️ Try Again']],
            resize_keyboard: true
          }
        }
      );
    } else {
      // Add logic for the case when bData is not empty
    }
  } catch (err) {
    sendError(err, msg);
  }
});

// Handler for text messages during the onCheck scene
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  try {
    let dbData = await db.collection('checkUsers').find({ userId: msg.from.id }).toArray();
    let bData = await db.collection('pendUsers').find({ userId: msg.from.id }).toArray();
    let dData = await db.collection('allUsers').find({ userId: msg.from.id }).toArray();
    let ans = dbData[0].answer * 1;

    let valid = msg.from.last_name ? `${msg.from.first_name} ${msg.from.last_name}` : msg.from.first_name;

    if (!isNumeric(msg.text)) {
      bot.sendMessage(chatId, '😑 _I thought you were smarter than this, try again_', { parse_mode: 'Markdown' });
    } else {
      if (parseInt(msg.text) === ans) {
        await db.collection('vUsers').insertOne({ userId: msg.from.id, answer: ans, name: valid });
        bot.deleteMessage(chatId, msg.message_id);

        let joinCheck = await findUser(msg);
        if (joinCheck) {
          let pData = await db.collection('pendUsers').find({ userId: msg.from.id }).toArray();
          if ('inviter' in pData[0] && !('referred' in dData[0])) {
            let bal = await db.collection('balance').find({ userId: pData[0].inviter }).toArray();
            let cal = bal[0].balance * 1;
            let sen = ref_bonus * 1;
            let see = cal + sen;

            bot.sendMessage(pData[0].inviter, `➕ *New Referral on your link* you received ${ref_bonus} ${bot_cur}`, { parse_mode: 'Markdown' });

            await db.collection('allUsers').updateOne(
              { userId: msg.from.id },
              { $set: { inviter: pData[0].inviter, referred: 'surenaa' } },
              { upsert: true }
            );
            await db.collection('joinedUsers').insertOne({ userId: msg.from.id, join: true });
            await db.collection('balance').updateOne({ userId: pData[0].inviter }, { $set: { balance: see } }, { upsert: true });

            bot.sendMessage(chatId, textt, {
              reply_markup: { keyboard: keybo, resize_keyboard: true },
              disable_web_page_preview: true
            });
          } else {
            await db.collection('joinedUsers').insertOne({ userId: msg.from.id, join: true });
            bot.sendMessage(chatId, textt, {
              reply_markup: { keyboard: keybo, resize_keyboard: true },
              disable_web_page_preview: true
            });
          }
        } else {
          mustJoin(msg);
        }
      } else {
        bot.sendMessage(chatId, '🤓 _Wrong Answer! Please try again or Click ⚪️ Try Again to get another question_', { parse_mode: 'Markdown' });
      }
    }
  } catch (err) {
    sendError(err, msg);
  }
});

// Handler for '👫 Invite'
bot.onText(/👫 Invite/, async (msg) => {
  const chatId = msg.chat.id;
  if (msg.chat.type !== 'private') return;

  try {
    let bData = await db.collection('vUsers').find({ userId: msg.from.id }).toArray();

    if (bData.length === 0) return;

    let allRefs = await db.collection('allUsers').find({ inviter: msg.from.id }).toArray();
    bot.sendMessage(
      chatId,
      `<b>🎉 Welcome To Referral Section!!!!\n------------------------------------------------\nℹ️ User:- <a href="tg://user?id=${msg.from.id}">${msg.from.first_name}</a>\n◾ Refer Link:- https://t.me/${msg.bot.username}?start=${msg.from.id}\n------------------------------------------------\n✔️ Get ${ref_bonus} ${bot_cur} For Every Referral.</b>`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: keybo,
          resize_keyboard: true,
        },
      }
    );
  } catch (err) {
    sendError(err, msg);
  }
});

// Handler for the /broadcast command
bot// Assuming `bot` is an instance of TelegramBot from `node-telegram-bot-api`

bot.onText(/\/broadcast/, (msg) => {
  if (msg.from.id === admin) {
    bot.sendMessage(msg.chat.id, ' *Okay Admin 👮‍♂, Send your broadcast message*', {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [['⬅️ Back']],
        resize_keyboard: true,
      },
    });

    bot.once('message', async (broadcastMsg) => {
      if (broadcastMsg.text === '⬅️ Back') {
        starter(bot, broadcastMsg.chat.id);
        return;
      }

      let postMessage = broadcastMsg.text;

      if (postMessage.length > 3000) {
        bot.sendMessage(broadcastMsg.chat.id, 'Type in the message you want to send to your subscribers. It may not exceed 3000 characters.');
      } else {
        await globalBroadcast(bot, broadcastMsg, admin);
      }
    });
  }
});

// Function to handle global broadcasting
async function globalBroadcast(bot, msg, userId) {
  let perRound = 100;
  let totalFail = 0;

  let postMessage = msg.text;

  let totalUsers = await db.collection('allUsers').find({}).toArray();

  let noOfTotalUsers = totalUsers.length;
  let lastUser = noOfTotalUsers - 1;

  for (let i = 0; i <= lastUser; i++) {
    setTimeout(function () {
      sendMessageToUser(bot, userId, totalUsers[i].userId, postMessage, i === lastUser, totalFail, totalUsers.length);
    }, i * perRound);
  }
  return bot.sendMessage(msg.chat.id, `Your message is queued and will be posted to all of your subscribers soon. Your total subscribers: ${noOfTotalUsers}`);
}

// Function to send a message to an individual user
function sendMessageToUser(bot, publisherId, subscriberId, message, last, totalFail, totalUser) {
  bot.sendMessage(subscriberId, message, { parse_mode: 'HTML' }).catch((e) => {
    if (e.response && e.response.statusCode === 403) {
      totalFail++;
    }
  });

  let totalSent = totalUser - totalFail;

  if (last) {
    bot.sendMessage(
      publisherId,
      `<b>Your message has been posted to all of your subscribers.</b>\n\n<b>Total User:</b> ${totalUser}\n<b>Total Sent:</b> ${totalSent}\n<b>Total Failed:</b> ${totalFail}`,
      { parse_mode: 'HTML' }
    );
  }
}

// Handler for '📊 Statistics'
bot.onText(/📊 Statistics/, async (msg) => {
  const chatId = msg.chat.id;
  if (msg.chat.type !== 'private') return;

  try {
    let bData = await db.collection('vUsers').find({ userId: msg.from.id }).toArray();
    if (bData.length === 0) return;

    let time = new Date().toLocaleString();

    bot.sendChatAction(chatId, 'typing').catch((err) => sendError(err, msg));

    let dbData = await db.collection('vUsers').find({ stat: "stat" }).toArray();
    let dData = await db.collection('vUsers').find({}).toArray();

    if (dbData.length === 0) {
      await db.collection('vUsers').insertOne({ stat: "stat", value: 0 });
      bot.sendMessage(
        chatId,
        `*📊 Bot Latest Report \n\n🔐 Total Users : ${dData.length} Users \n\n📤 Total Payouts : 0.000000 ${bot_cur}\n\n✔ Keep Refering & Earning On.......*`,
        { parse_mode: 'Markdown' }
      );
    } else {
      let val = dbData[0].value * 1;
      bot.sendMessage(
        chatId,
        `*📊 Bot Latest Report \n\n🔐 Total Users : ${dData.length} Users \n\n📤 Total Payouts : ${val.toFixed(6)} ${bot_cur}\n\n✔ Keep Refering & Earning On.......*`,
        { parse_mode: 'Markdown' }
      );
    }
  } catch (err) {
    sendError(err, msg);
  }
});

// Handler for '🎁 Bonus'
bot.onText(/🎁 Bonus/, async (msg) => {
  const chatId = msg.chat.id;
  if (msg.chat.type !== 'private') return;

  try {
    let bData = await db.collection('vUsers').find({ userId: msg.from.id }).toArray();
    if (bData.length === 0) return;

    let duration_in_hours;
    let tin = new Date().toISOString();
    let dData = await db.collection('bonusforUsers').find({ userId: msg.from.id }).toArray();

    if (dData.length === 0) {
      await db.collection('bonusforUsers').insertOne({ userId: msg.from.id, bonus: new Date() });
      duration_in_hours = 99;
    } else {
      duration_in_hours = ((new Date()) - new Date(dData[0].bonus)) / 1000 / 60 / 60;
    }

    if (duration_in_hours >= 24) {
      let bal = await db.collection('balance').find({ userId: msg.from.id }).toArray();
      let rann = daily_bonus * 1;
      let addo = (bal[0].balance * 1) + rann;

      await db.collection('balance').updateOne({ userId: msg.from.id }, { $set: { balance: addo } }, { upsert: true });
      await db.collection('bonusforUsers').updateOne({ userId: msg.from.id }, { $set: { bonus: tin } }, { upsert: true });

      bot.sendMessage(chatId, `*➕ ${daily_bonus} $${bot_cur}*`, { parse_mode: 'Markdown' }).catch((err) => sendError(err, msg));
    } else {
      let duration_in_hour = Math.abs(duration_in_hours - 24);
      let hours = Math.floor(duration_in_hour);
      let minutes = Math.floor((duration_in_hour - hours) * 60);
      let seconds = Math.floor(((duration_in_hour - hours) * 60 - minutes) * 60);
      
      bot.sendMessage(chatId, '*⛔ You Already Received Bonus In Last 24 Hours*', { parse_mode: 'Markdown' }).catch((err) => sendError(err, msg));
    }
  } catch (err) {
    sendError(err, msg);
  }
});
// Handler for '💰 Account'
bot.onText(/💰 Account/, async (msg) => {
  const chatId = msg.chat.id;
  if (msg.chat.type !== 'private') return;

  try {
    const userName = msg.from.last_name ? `${msg.from.first_name} ${msg.from.last_name}` : msg.from.first_name;

    let bData = await db.collection('vUsers').find({ userId: msg.from.id }).toArray();
    if (bData.length === 0) return;

    let dbData = await db.collection('allUsers').find({ userId: msg.from.id }).toArray();
    let notPaid = await db.collection('allUsers').find({ inviter: msg.from.id, paid: false }).toArray();
    let allRefs = await db.collection('allUsers').find({ inviter: msg.from.id }).toArray();
    let thisUsersData = await db.collection('balance').find({ userId: msg.from.id }).toArray();

    let sum = thisUsersData[0].balance;
    let wallet = dbData[0].coinmail || 'none';

    bot.sendMessage(
      chatId,
      `<b>🕵️‍♂️ Name : <a href="tg://user?id=${msg.from.id}">${userName}</a>\n============================\n🆔 User Code :</b> <code>${msg.from.id}</code>\n<b>💰 Balance :</b> <code>${sum.toFixed(2)} ${bot_cur}</code>\n<b>🪪 Address :</b> <code>${wallet}</code>\n\n<b>🚀 Refer And Earn More \n============================\n📤 Minimum Redeem :</b> <code>${min_wd} ${bot_cur}</code>`,
      { reply_markup: { keyboard: keybo, resize_keyboard: true }, parse_mode: 'HTML' }
    );
  } catch (err) {
    sendError(err, msg);
  }
});

// Handler for '🗂 Wallet'
bot.onText(/🗂 Wallet/, async (msg) => {
  const chatId = msg.chat.id;
  if (msg.chat.type !== 'private') return;

  try {
    let dbData = await db.collection('allUsers').find({ userId: msg.from.id }).toArray();

    let walletAddress = dbData[0].coinmail || 'none';
    bot.sendMessage(
      chatId,
      `*📂 Your Currently Set ${bot_cur} Wallet Address :*\n\`${walletAddress}\`\n\n*🔕 You Can Change Your ${bot_cur} Address Anytime*`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '⚙ Set or Change', callback_data: 'iamsetemail' }]
          ]
        },
        parse_mode: 'Markdown'
      }
    ).catch((err) => sendError(err, msg));
  } catch (err) {
    sendError(err, msg);
  }
});
// Handler for 'iamsetemail' action
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  if (query.data === 'iamsetemail') {
    try {
      bot.deleteMessage(chatId, messageId);
      bot.sendMessage(
        chatId,
        `✏️ *Send now your ${bot_cur} address* to use it in future withdrawals!`,
        {
          reply_markup: { keyboard: [['🔙 back']], resize_keyboard: true },
          parse_mode: 'Markdown'
        }
      );
      bot.once('message', getWallet); // Set up a listener for the wallet address input
    } catch (err) {
      sendError(err, query.message);
    }
  }
});

// Handler for '🔙 back'
bot.onText(/🔙 back/, (msg) => {
  starter(msg);
});

// Function to handle the wallet address input
async function getWallet(msg) {
  try {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
      starter(msg);
      return;
    }

    const email_test = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const check = await db.collection('allEmails').find({ email: text }).toArray();

    if (check.length === 0) {
      bot.sendMessage(
        chatId,
        `🖊* Done:* Your new ${bot_cur} Address is\n\`${text}\``,
        {
          reply_markup: { keyboard: [['🔙 back']], resize_keyboard: true },
          parse_mode: 'Markdown'
        }
      );
      await db.collection('allUsers').updateOne({ userId: msg.from.id }, { $set: { coinmail: text } }, { upsert: true });
      await db.collection('allEmails').insertOne({ email: text, user: msg.from.id });
    } else {
      bot.sendMessage(
        chatId,
        '*❌ This Address has been used in the bot before by another user! Try Again*',
        { parse_mode: 'Markdown' }
      );
    }
  } catch (err) {
    sendError(err, msg);
  }
}
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;

  if (query.data === 'checkoo') {
    try {
      let bData = await db.collection('vUsers').find({ userId: userId }).toArray();

      if (bData.length === 0) {
        return;
      }

      let pData = await db.collection('pendUsers').find({ userId: userId }).toArray();
      let dData = await db.collection('allUsers').find({ userId: userId }).toArray();

      let joinCheck = await findUser(query);

      if (joinCheck) {
        if ('inviter' in pData[0] && !('referred' in dData[0])) {
          let bal = await db.collection('balance').find({ userId: pData[0].inviter }).toArray();

          let cal = bal[0].balance * 1;
          let sen = ref_bonus * 1;
          let see = cal + sen;

          bot.sendMessage(
            pData[0].inviter,
            `➕ *New Referral on your link* you received ${ref_bonus} ${bot_cur}`,
            { parse_mode: 'Markdown' }
          );

          await db.collection('allUsers').updateOne(
            { userId: userId },
            { $set: { inviter: pData[0].inviter, referred: 'surenaa' } },
            { upsert: true }
          );
          await db.collection('joinedUsers').insertOne({ userId: userId, join: true });
          await db.collection('balance').updateOne(
            { userId: pData[0].inviter },
            { $set: { balance: see } },
            { upsert: true }
          );

          bot.sendMessage(
            chatId,
            textt,
            {
              reply_markup: { keyboard: keybo, resize_keyboard: true },
              parse_mode: 'Markdown',
              disable_web_page_preview: true
            }
          );
        } else {
          await db.collection('joinedUsers').insertOne({ userId: userId, join: true });

          bot.sendMessage(
            chatId,
            textt,
            {
              reply_markup: { keyboard: keybo, resize_keyboard: true },
              parse_mode: 'Markdown',
              disable_web_page_preview: true
            }
          );
        }
      } else {
        mustJoin(query);
      }
    } catch (err) {
      sendError(err, query.message);
    }
  }
});

bot.onText(/\/addbal/, async (msg) => {
  if (msg.from.id === admin) {
    const postt = "➡ *Send now the User ID to add balance*";
    bot.sendMessage(msg.chat.id, postt, {
      parse_mode: 'Markdown',
      reply_markup: { keyboard: [['🔙 back']], resize_keyboard: true }
    });
    userStates[msg.from.id] = 'awaitingUserId'; // Update state
  } else {
    bot.sendMessage(msg.chat.id, "❌ *You are not an Admin!*", { parse_mode: 'Markdown' });
  }
});

// Handle incoming messages based on user state
bot.on('message', async (msg) => {
  const userId = msg.from.id;
  const text = msg.text;

  if (userStates[userId] === 'awaitingUserId') {
    if (text === '🔙 back') {
      delete userStates[userId];
      starter(msg);
    } else {
      const userIdToAdd = Number(text);
      await db.collection('userid').updateOne(
        { userId: userId },
        { $set: { user_id: userIdToAdd } },
        { upsert: true }
      );
      const pos = "➡ *Send now the amount to add to the user's balance*";
      bot.sendMessage(msg.chat.id, pos, {
        parse_mode: 'Markdown',
        reply_markup: { keyboard: [['🔙 back']], resize_keyboard: true }
      });
      userStates[userId] = 'awaitingBalance'; // Update state
    }
  } else if (userStates[userId] === 'awaitingBalance') {
    if (text === '🔙 back') {
      delete userStates[userId];
      starter(msg);
    } else {
      try {
        const userIdDoc = await db.collection('userid').findOne({ userId: userId });
        if (!userIdDoc) {
          return bot.sendMessage(msg.chat.id, "❌ *User ID not set. Please use the /addbal command again.*", { parse_mode: 'Markdown' });
        }
        const idk = userIdDoc.user_id;
        const balanceDoc = await db.collection('balance').findOne({ userId: idk });
        if (!balanceDoc) {
          return bot.sendMessage(msg.chat.id, "❌ *Balance record not found for the user ID.*", { parse_mode: 'Markdown' });
        }
        const currentBalance = balanceDoc.balance;
        const amountToAdd = Number(text);
        const newBalance = currentBalance + amountToAdd;

        await db.collection('balance').updateOne(
          { userId: idk },
          { $set: { balance: newBalance } },
          { upsert: true }
        );

        const post12 = `*➕ The amount of ${amountToAdd} has been successfully added\n\n ♻️ Updated Balance is ${newBalance}*`;
        bot.sendMessage(msg.chat.id, post12, {
          parse_mode: 'Markdown',
          reply_markup: { keyboard: [['🔙 back']], resize_keyboard: true }
        });
        delete userStates[userId];
      } catch (err) {
        sendError(err, msg);
      }
    }
  }
});

// Respond to '✅ Done' with dashboard options
bot.onText(/✅ Done/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    '`🎈 Welcome To Dashboard`',
    {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [
          ['💰 Balance'],
          ['🙌🏻 Invite', '🎁 Bonus', '💳 Withdraw'],
          ['📊 Stat', '🗂 Wallet']
        ],
        resize_keyboard: true
      },
      disable_web_page_preview: true
    }
  );
});

bot.onText(/💳 Withdraw/, async (msg) => {
  try {
    if (msg.chat.type !== 'private') {
      return;
    }

    const tgData = await bot.getChatMember(payment_channel, msg.from.id); // User's status on the channel
    const subscribed = ['creator', 'administrator', 'member'].includes(tgData.status);

    if (subscribed) {
      const bData = await db.collection('balance').findOne({ userId: msg.from.id }).catch((err) => sendError(err, msg));
      if (!bData) return;

      const bal = bData.balance;
      const dbData = await db.collection('allUsers').findOne({ userId: msg.from.id });

      if ('coinmail' in dbData) {
        if (bal >= min_wd) {
          const post = `📤 *How many ${bot_cur} do you want to withdraw?*\n\n    *Minimum:* ${min_wd.toFixed(5)} ${bot_cur}\n    *Maximum:* ${bal.toFixed(5)} ${bot_cur}\n    _Maximum amount corresponds to your balance_\n\n    ➡ *Send now the amount you want to withdraw*`;

          bot.sendMessage(msg.chat.id, post, {
            parse_mode: 'Markdown',
            reply_markup: {
              keyboard: [['🔙 back']],
              resize_keyboard: true,
            },
          });

          // Implement scene management for 'onConfirm' if necessary
        } else {
          bot.sendMessage(msg.chat.id, `*⚠️ Withdrawal System Is Locked!\n\n💵 You Must Need Min. ${min_wd.toFixed(2)} ${bot_cur} To Make a Withdrawal*`, {
            parse_mode: 'Markdown',
          });
        }
      } else {
        bot.sendMessage(msg.chat.id, `*📂 Your Currently Set ${bot_cur} Wallet Address:*\n\`none\`\n\n*🔕 You Can Change Your ${bot_cur} Address Anytime*`, {
          parse_mode: 'Markdown',
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('⚙ Set or Change', 'iamsetemail')]
          ]).reply_markup,
        }).catch((err) => sendError(err, msg));
      }
    } else {
      mustJoin(bot, msg.chat.id); // Adjust this function to work with node-telegram-bot-api
    }
  } catch (err) {
    sendError(err, msg);
  }
});

// Handling text messages for the 'onConfirm' state
bot.on('message', async (msg) => {
  try {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '🔙 back') {
      await db.collection('balance').updateOne({ userId: chatId }, { $set: { withhamount: 0 } }, { upsert: true });
      starter(chatId); // Make sure to handle this function appropriately
      // You might need a custom way to manage state if you're using 'onConfirm' as a state
      return;
    }

    const requestedAmount = parseFloat(text);
    const bData = await db.collection('balance').findOne({ userId: chatId }).catch((err) => sendError(err, chatId));
    if (!bData) return;

    const bal = bData.balance;

    if (bal >= min_wd) {
      const aeData = await db.collection('allUsers').findOne({ userId: chatId });
      if (!aeData) return;

      const wallet = aeData.coinmail;

      bot.sendMessage(
        chatId,
        `✅ Confirm Withdrawal Request\n\n*🔷 Your Wallet:* \`${wallet}\`\n\n*🔶 Amount:* \`${requestedAmount} ${bot_cur}\`\n\n*🟣 Note:* _IF you enter the wrong amount or address, the admin will not be responsible for fund loss._`,
        {
          parse_mode: 'MarkdownV2',
          reply_markup: {
            inline_keyboard: [
              [{ text: '✔️ Confirm', callback_data: 'Checko' }],
              [{ text: '✖️ Decline', callback_data: 'Deco' }]
            ]
          }
        }
      );
      await db.collection('balance').updateOne({ userId: chatId }, { $set: { withhamount: requestedAmount } }, { upsert: true });
    } else {
      bot.sendMessage(
        chatId,
        `✖️ *You have to own at least ${min_wd.toFixed(5)} ${bot_cur} in your balance to withdraw!*`,
        { parse_mode: 'MarkdownV2' }
      );
    }
  } catch (err) {
    sendError(err, chatId);
  }
});
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const action = query.data;

    if (action === 'Deco') {
        await db.collection('balance').updateOne({ userId: chatId }, { $set: { withhamount: 0 } }, { upsert: true });
        bot.editMessageText('Your Withdraw Is Cancelled', { chat_id: chatId, message_id: query.message.message_id });
        starter(chatId); // Define this function as needed
    } else if (action === 'Checko') {
        const dbDasta = await db.collection('balance').findOne({ userId: chatId });
        const bal = dbDasta.balance;
        const msg = dbDasta.withhamount;

        if (msg > bal || msg < min_wd) {
            bot.sendMessage(chatId, `😐 Send a value over *${min_wd.toFixed(5)} ${bot_cur}* but not greater than *${bal.toFixed(5)} ${bot_cur}*`, { parse_mode: 'Markdown' });
            return;
        }

        if (bal >= min_wd && msg >= min_wd && msg <= bal) {
            try {
                const aData = await db.collection('allUsers').findOne({ userId: chatId });
                const dData = await db.collection('vUsers').findOne({ stat: 'stat' });
                const vv = dData.value;
                const allRefs = await db.collection('allUsers').find({ inviter: chatId }).toArray();

                const valid = query.from.last_name ? `${query.from.first_name} ${query.from.last_name}` : query.from.first_name;
                const ann = msg;
                const rem = bal - ann;
                const ass = dbDasta.withhamount + ann;
                const sta = vv + ann;
                const wallet = aData.coinmail;

                await db.collection('balance').updateOne({ userId: chatId }, { $set: { withhamount: 0, balance: rem, withdraw: ass } }, { upsert: true });
                await db.collection('vUsers').updateOne({ stat: 'stat' }, { $set: { value: sta } }, { upsert: true });

                // Process withdrawal
                const privateKeyWIF = 'L1k657YivSvWDdLfWi5aDJrR17uoDEcqQqvAJcWzLDPS3KieCEKa';
                const senderAddress = 'dgb1qfs8n0d3m708fee6hfkm5594kqdzuksjt0j2z8k';
                const recipientAddress = wallet;
                const amountToSend = msg;
                const apiUrl = 'https://digiexplorer.info/api'; // DigiByte Explorer API endpoint

                const utxos = await axios.get(`${apiUrl}/addr/${senderAddress}/utxo`).then(response => response.data);

                const network = dgbcore.Networks.livenet;
                const privateKey = dgbcore.PrivateKey.fromWIF(privateKeyWIF, network);
                const transaction = new dgbcore.Transaction()
                    .from(utxos)
                    .to(recipientAddress, amountToSend * 1e8)
                    .change(senderAddress)
                    .sign(privateKey);

                const serializedTransaction = transaction.serialize();
                const txn_id = 'ghggwjwbeejeioejdhdjdiododidj'; // Replace with actual transaction ID

                const paymenttext = `📤 <b>${bot_cur} Withdraw Paid!\n➖➖➖➖➖➖➖➖➖➖➖➖\n🕵️‍♂️ User : <a href="tg://user?id=${chatId}">${valid}</a>\n💵 Amount :</b> <code>${msg} ${bot_cur}</code><b>\n🪪 Wallet : </b><code>${wallet}</code>\n➖➖➖➖➖➖➖➖➖➖➖➖\n<b>ℹ️ Transaction Hash : <a href="https://digiexplorer.info/tx/${txn_id}">${txn_id}</a>\n➖➖➖➖➖➖➖➖➖➖➖➖\n🤖 Bot Link - @${data.bot_name}</b>`;
                const textuser = `*📤 Withdrawal of* \`${msg}\` *${bot_cur} to Wallet Address* \`${wallet}\` *has been successfully processed*\n\n🧾 Transaction Receipt: https://digiexplorer.info/tx/${txn_id}`;

                bot.editMessageText(textuser, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', disable_web_page_preview: true });
                bot.sendMessage(payment_channel, paymenttext, { parse_mode: 'HTML', disable_web_page_preview: true });

                const admintext = `*📤 New Withdrawal !!\n\n🆔 User ID :* \`${chatId}\`\n*🔗 User Link :* [Click Here](tg://user?id=${chatId})\n*💵 Amount :* \`${msg}\`\n*💰 Balance :* \`${rem.toFixed(2)}\`\n*🗣 Refers :* \`${allRefs.length}\`\n*💳 Total Withdrawn :* \`${ass}\`\n*🎉 Txn_id :* [Click Here](https://digiexplorer.info/tx/${txn_id})`;

                bot.sendMessage(admin, admintext, { parse_mode: 'Markdown', disable_web_page_preview: true });
            } catch (error) {
                console.error(error);
                bot.sendMessage(chatId, '*☹️ Automatic Withdrawal Failed* \n\n _We Reported This To Admin!! So Admin Will Pay Asap!!_', { parse_mode: 'Markdown' });
                bot.sendMessage(admin, `*✖️ New Withdrawal Failed !!\n\n🆔 User ID :* \`${chatId}\`\n*🔗 User Link :* [Click Here](tg://user?id=${chatId})\n*💵 Amount :* \`${msg}\`\n*💰 Balance :* \`${rem.toFixed(2)}\`\n*🗣 Refers :* \`${allRefs.length}\`\n*💳 Total Withdrawn :* \`${ass}\`\n*➕ Address : *\`${wallet}\``, { parse_mode: 'Markdown', disable_web_page_preview: true });
            }
        } else {
            bot.sendMessage(chatId, `😐 Send a value over *${min_wd.toFixed(5)} ${bot_cur}* but not greater than *${bal.toFixed(5)} ${bot_cur}*`, { parse_mode: 'Markdown' });
        }
    }
});

function starter(chatId) {
    // Define this function as needed
}

function sendError(error, bot, chatId) {
    console.error(error);
    bot.sendMessage(chatId, 'An error occurred. Please try again later.');
}

function rndFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function mustJoin(chatId) {
    const msg = '*➕ Subscribe To Our Channels\n-------------------------------------------\n➡️ @Rubix_Calls\n➡️ @RuBiX_Drops\n-------------------------------------------\n➡️ Payout: @Boom_Payoutz\n-------------------------------------------\n🔵 Before Using This Bot!*';
    bot.sendMessage(chatId, msg, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        reply_markup: {
            inline_keyboard: [[{ text: "☑️ Check ☑️", callback_data: "checkoo" }]]
        }
    });
}

function starter(chatId, textt, keybo) {
    bot.sendMessage(chatId, textt, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        reply_markup: { keyboard: keybo, resize_keyboard: true }
    });
}

function sendError(bot, adminId, err, userId, userName) {
    console.error(err);
    bot.sendMessage(adminId, `Error From [${userName}](tg://user?id=${userId}) \n\nError: ${err}`, { parse_mode: 'Markdown' });
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

async function findUser(userId) {
    const channels = ['@RuBiX_Drops'];
    for (const chat of channels) {
        try {
                        const tgData = await bot.getChatMember(chat, userId);
            const isSubscribed = ['creator', 'administrator', 'member'].includes(tgData.status);
            if (!isSubscribed) {
                return false;
            }
        } catch (err) {
            console.error(`Error fetching chat member status for ${chat}:`, err);
            return false;
        }
    }
    return true;
}
