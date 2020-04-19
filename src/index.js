import fs from 'fs';
import * as api from './api';
import * as bot from './telegram';
import Table from 'cli-table'
import TelegramBot from 'node-telegram-bot-api';

let servers = [];
let known = [];

bot.boot();

if (fs.existsSync('known.json')) {
    let knownFile = fs.readFileSync('known.json', 'utf8');
    known = JSON.parse(knownFile);
}

async function updateData() {
    servers = await api.servers();
    processData();
}

function processData() {
    fs.writeFileSync('servers.json', JSON.stringify(servers));

    servers = servers.filter((a) => a.regions.map((region) => region.country).includes('Brazil'));
    servers = servers.map((server) => {
        let a = server.regions.filter((region) => region.country === 'Brazil');
        return {
            ...server,
            pricing: a[0].pricing,
        };
    });
    servers.sort((a, b) => a.pricing.brl_month - b.pricing.brl_month);
    const table = new Table({
        head: ['ID', 'Processador', 'RAM', 'Storage', 'R$/month', '$/month', 'R$/hour', '$/hour', 'Type']
    });


    servers.forEach((server) => {
        if (!server.pricing.brl_month) return;
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
            bot.sendMessageToAll(`✅ *New server available* :\n* + ID*:         ${id}\n* + CPU*:        ${cpu}\n* + RAM*:      ${ram}\n* + DISKS*:    ${disks}\n* + PRICE*:    ${price}\n* + DEPLOY*: ${deploy}\n\n Check it at: https://www.maxihost.com.br/precos`);
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
    });

    let ids = servers.map((server) => server.id);
    let missing = known.filter((id) => !ids.includes(id));

    missing.forEach((id) => {
        bot.sendMessageToAll(`❌ *Server sold:* ${id}`);
    });

    known = known.filter((id) => ids.includes(id));


    let knownFile = JSON.stringify(known);

    fs.writeFileSync('known.json', knownFile, 'utf8');

    console.log(table.toString());
}

updateData();
setInterval(updateData, 60 * 1000);
