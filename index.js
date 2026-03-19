const { 
    default: makeWASocket, useMultiFileAuthState, 
    fetchLatestBaileysVersion, DisconnectReason, delay 
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const http = require('http');

// --- 1. تشغيل سيرفر وهمي لـ Render (المنفذ 3000) ---
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.write('RITZ ELITE SYSTEM IS ACTIVE ⚔️');
  res.end();
}).listen(port);

async function startRitzSystem() {
    // استخدام مجلد auth_ritz لتخزين الجلسة
    const { state, saveCreds } = await useMultiFileAuthState('auth_ritz');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false, // سنستخدم الربط بالرقم
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // --- 2. نظام الربط برقم الهاتف (Pairing Code) ---
    if (!sock.authState.creds.registered) {
        const phoneNumber = "967373266081"; // رقم البوت المطلوب ربطه
        setTimeout(async () => {
            let code = await sock.requestPairingCode(phoneNumber);
            console.log("\n\n" + "=".repeat(30));
            console.log(`⚔️ كود الربط الخاص بك هو: \x1b[32m${code}\x1b[0m`);
            console.log("=".repeat(30) + "\n\n");
        }, 5000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startRitzSystem();
        } else if (connection === 'open') {
            console.log("⚔️ تم تفعيل نظام النخبة لنقابة RITZ بنجاح!");
        }
    });

    // --- 3. محرك الأوامر (للنخبة فقط) ---
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        const m = chatUpdate.messages[0];
        if (!m.message) return;

        const from = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        const body = (m.message.conversation || m.message.extendedTextMessage?.text || "").trim();
        const prefix = ".";

        if (!body.startsWith(prefix)) return;

        // قائمة النخبة (أنت، البوت، رقمك الإضافي)
        const botNumber = sock.user.id.split(':')[0] + "@s.whatsapp.net";
        const myNumbers = ["967737266081@s.whatsapp.net", "967373266081@s.whatsapp.net"];
        const isElite = myNumbers.includes(sender) || sender === botNumber || m.key.fromMe;

        if (!isElite) return; // تجاهل أي شخص آخر

        const args = body.slice(prefix.length).trim().split(/ +/);
        const cmd = args.shift().toLowerCase();

        switch (cmd) {
            case 'اوامر':
                const menu = `⚔️ *قائمة تحكم النخبة RITZ* ⚔️\n\n` +
                             `📜 *.اوامر* : عرض القائمة\n` +
                             `📢 *.منشن* : نداء للجميع\n` +
                             `🎯 *.تاغ* : منشن بالرد\n` +
                             `🚫 *.طرد* : استبعاد بالرد\n` +
                             `🗑️ *.حذف* : مسح بالرد\n` +
                             `⚡ *.بوت* : حالة النظام`;
                await sock.sendMessage(from, { text: menu });
                break;

            case 'منشن':
                if (from.endsWith('@g.us')) {
                    const group = await sock.groupMetadata(from);
                    const mentions = group.participants.map(p => p.id);
                    let text = "📣 *نداء عام من النخبة للجميع:*\n\n";
                    mentions.forEach(id => text += `@${id.split('@')[0]} `);
                    await sock.sendMessage(from, { text, mentions });
                }
                break;

            case 'تاغ':
                const quotedTag = m.message.extendedTextMessage?.contextInfo?.participant;
                if (quotedTag) {
                    await sock.sendMessage(from, { text: `🎯 نداء للنخبة: @${quotedTag.split('@')[0]}`, mentions: [quotedTag] });
                }
                break;

            case 'بوت':
                await sock.sendMessage(from, { text: "🚀 النظام متصل ويعمل تحت حماية النخبة." });
                break;
        }
    });
}

// البدء مع تنظيف المنفذ
startRitzSystem();

