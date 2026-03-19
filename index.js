const { 
    default: makeWASocket, useMultiFileAuthState, delay, 
    fetchLatestBaileysVersion, DisconnectReason 
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const http = require('http');

// --- 1. سيرفر وهمي لإبقاء Render يعمل 24 ساعة ---
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.write('RITZ System is Online ⚔️');
  res.end();
}).listen(port);

async function startRitzSystem() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_ritz');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ["RITZ Elite System", "Chrome", "20.0.04"]
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startRitzSystem();
        } else if (connection === 'open') {
            console.log("⚔️ تم تفعيل نظام النخبة لنقابة RITZ!");
        }
    });

    // --- 2. محرك الأوامر الذكي ---
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        const m = chatUpdate.messages[0];
        if (!m.message) return;

        const from = m.key.remoteJid;
        // استخراج رقم المرسل بدقة
        const sender = m.key.participant || m.key.remoteJid;
        const body = m.message.conversation || m.message.extendedTextMessage?.text || "";
        const prefix = ".";

        if (!body.startsWith(prefix)) return;

        // --- نظام النخبة (قائمة المسموح لهم) ---
        const eliteNumbers = [
            "967737266081@s.whatsapp.net", // رقمك الأساسي (فراس)
            "967373266081@s.whatsapp.net", // رقم البوت (لأوامر النفس)
        ];

        // التحقق: هل المرسل من النخبة؟
        const isElite = eliteNumbers.includes(sender);
        if (!isElite) return; // تجاهل أي شخص غريب بصمت

        const args = body.slice(prefix.length).trim().split(/ +/);
        const cmd = args.shift().toLowerCase();

        switch (cmd) {
            case 'اوامر':
                const menu = `⚔️ *أهلاً بك في نظام النخبة RITZ* ⚔️\n\n` +
                             `📜 *.اوامر* : عرض القائمة\n` +
                             `📢 *.منشن* : تاغ للجميع\n` +
                             `👤 *.تاغ* : منشن شخص (رد على رسالته)\n` +
                             `🚫 *.طرد* : استبعاد (رد على الرسالة)\n` +
                             `🗑️ *.حذف* : مسح (رد على الرسالة)\n` +
                             `🛡️ *الحالة:* خاص للنخبة فقط`;
                await sock.sendMessage(from, { text: menu });
                break;

            case 'تاغ':
                // منشن شخص محدد بالرد على رسالته
                const quoted = m.message.extendedTextMessage?.contextInfo?.participant;
                if (quoted) {
                    await sock.sendMessage(from, { text: `🎯 نداء خاص للعضو: @${quoted.split('@')[0]}`, mentions: [quoted] });
                } else {
                    await sock.sendMessage(from, { text: "❌ رد على رسالة الشخص لعمل تاغ له!" });
                }
                break;

            case 'منشن':
                if (from.endsWith('@g.us')) {
                    const group = await sock.groupMetadata(from);
                    const mentions = group.participants.map(p => p.id);
                    let text = "📣 *نداء عام من النخبة لجميع الأعضاء:*\n\n";
                    mentions.forEach(m => text += `@${m.split('@')[0]} `);
                    await sock.sendMessage(from, { text, mentions });
                }
                break;

            case 'بوت':
                await sock.sendMessage(from, { text: "⚡ النظام يعمل بكفاءة تحت إشراف القائد رين." });
                break;
        }
    });
}

startRitzSystem();

