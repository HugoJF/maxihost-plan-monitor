import fs from 'fs';
import dotenv from 'dotenv';
import request from 'request';
import Table from 'cli-table'
import TelegramBot from 'node-telegram-bot-api';

dotenv.config({path: __dirname + '/.env'});

const token = process.env.TELEGRAM_API_KEY;
const bot = new TelegramBot(token, {polling: true});

const requestOptions = {
    json: true,
    timeout: 10000,
    headers: {
        "Authorization": process.env.MAXIHOST_API_KEY,
    }
};

let servers = [];
let chats = [];
let known = [];

if (fs.existsSync('chats.json')) {
    let chatsFile = fs.readFileSync('chats.json', 'utf8');
    chats = JSON.parse(chatsFile);
}

if (fs.existsSync('known.json')) {
    let knownFile = fs.readFileSync('known.json', 'utf8');
    known = JSON.parse(knownFile);
}

// Matches "/echo [whatever]"
bot.onText(/\/register/, (msg) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id;

    if (chats.includes(msg.chat.id)) {
        bot.sendMessage(chatId, 'You are already registered to receive updates!');
    } else {
        chats.push(msg.chat.id);

        let chatsFile = JSON.stringify(chats);

        fs.writeFileSync('chats.json', chatsFile, 'utf8');

        // send back the matched "whatever" to the chat
        bot.sendMessage(chatId, `You are registered to receive Maxihost updates!`);
    }
});

function sendMessageToAll(message) {
    chats.forEach((chatId) => {
        bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
        });
    })
}

function updateData() {
    servers = [];

    request.get('https://api.maxihost.com/plans', requestOptions, paginate);
}

function paginate(err, res, data) {
    try {
        data.servers.forEach((server) => {
            servers.push(server)
        });

        if (data.links.next) {
            request.get(data.links.next, requestOptions, paginate);
        } else {
            processData();
        }
    } catch (e) {
        console.log(e);
    }
}

function processData() {
    fs.writeFileSync('servers.json', JSON.stringify(servers));

    servers = servers.filter((a) => a.regions.map((region) => region.country).includes('Brazil'));
    servers.sort((a, b) => a.pricing.brl_month - b.pricing.brl_month);

    const table = new Table({
        head: ['ID', 'Processador', 'RAM', 'Storage', 'R$/month', '$/month', 'R$/hour', '$/hour', 'Type']
    });


    servers.forEach((server) => {
        try {
            let id = server.id;
            let cpuCount = server.specs.cpus.count === 2 ? 'Dual ' : '';
            let cpu = cpuCount + server.specs.cpus.type;
            let ram = server.specs.memory.total;
            let disks = server.specs.drives[0].count + ' x ' + server.specs.drives[0].size + ' ' + server.specs.drives[0].type;
            let price = 'R$ ' + server.pricing.brl_month.toFixed(0);
            let usdPrice = 'US$ ' + server.pricing.usd_month.toFixed(0);
            let priceHour = 'R$ ' + server.pricing.brl_hour.toFixed(2);
            let usdPriceHour = 'US$ ' + server.pricing.usd_hour.toFixed(2);
            let deploy = server.deploy_type === 'automated' ? '10m' : '24h';

            let markup = (server.pricing.brl_hour * 30 * 24 / server.pricing.brl_month * 100 - 100).toFixed(1);
            let usdMarkup = (server.pricing.usd_hour * 30 * 24 / server.pricing.usd_month * 100 - 100).toFixed(1);

            if (!known.includes(id)) {
                known.push(id);
                sendMessageToAll(`✅ *New server available* :\n* + ID*:         ${id}\n* + CPU*:        ${cpu}\n* + RAM*:      ${ram}\n* + DISKS*:    ${disks}\n* + PRICE*:    ${price}\n* + DEPLOY*: ${deploy}\n\n Check it at: https://www.maxihost.com.br/precos`);
            }

            table.push([
                id,
                cpu,
                ram,
                disks,
                price,
                usdPrice,
                priceHour + '+' + markup + '%',
                usdPriceHour + '+' + usdMarkup + '%',
                deploy,
            ]);
        } catch (e) {

        }
    });

    let ids = servers.map((server) => server.id);
    let missing = known.filter((id) => !ids.includes(id));

    missing.forEach((id) => {
        sendMessageToAll(`❌ *Server sold:* ${id}`);
    });

    known = known.filter((id) => ids.includes(id));


    let knownFile = JSON.stringify(known);

    fs.writeFileSync('known.json', knownFile, 'utf8');

    console.log(table.toString());
}

updateData();
setInterval(updateData, 60 * 1000);