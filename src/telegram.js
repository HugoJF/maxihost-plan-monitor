import fs from "fs";
import TelegramBot from "node-telegram-bot-api";

const token = process.env.TELEGRAM_API_KEY;
const bot = new TelegramBot(token, {polling: true});
let chats = [];

export async function boot() {
    if (fs.existsSync('chats.json')) {
        let chatsFile = fs.readFileSync('chats.json', 'utf8');
        chats = JSON.parse(chatsFile);
    }

    bot.onText(/\/register/, (msg) => {
        const id = msg.chat.id;

        if (chats.includes(id)) {
            bot.sendMessage(id, 'You are already registered to receive updates!');
            return;
        }

        chats.push(id);

        fs.writeFileSync('chats.json', JSON.stringify(chats), 'utf8');

        // send back the matched "whatever" to the chat
        bot.sendMessage(id, `You are now registered to receive Maxihost updates!`);
    });
}

export function sendMessageToAll(message) {
    chats.forEach((id) => {
        bot.sendMessage(id, message, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
        });
    })
}
