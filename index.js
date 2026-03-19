const { 
    default: makeWASocket, useMultiFileAuthState, delay, 
    fetchLatestBaileysVersion, DisconnectReason 
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const http = require('http');

// --- 1. خدعة الـ PORT لإبقاء Render مستيقظاً ---
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.write('RITZ-BOT System is Online ⚔️');
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
        browser: ["RITZ System", "Chrome", "20.0.04"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startRitzSystem();
        } else if (connection === 'open') {
            console.log("⚔️ تم تفعيل نظام نقابة RITZ بنجاح على السحاب!");
        }
    });

    // --- 2. محرك الأوامر الذكي بنظام الحماية ---
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        const m = chatUpdate.messages[0];
        if (!m.message || m.key.fromMe) return;

        const from = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        const body = m.message.conversation || m.message.extendedTextMessage?.text || "";
        
        const prefix = ".";
        if (!body.startsWith(prefix)) return;

        // --- نظام حماية القائد رين (فراس) ---
        // السطر القادم يضمن أن البوت لا يستجيب إلا لرقمك الشخصي
        const ownerNumber = "967737266081@s.whatsapp.net";
        if (sender !== ownerNumber) {
            return; // تجاهل أي شخص آخر بصمت
        }

        const cmd = body.slice(prefix.length).trim().split(' ')[0].toLowerCase();

        switch (cmd) {
            case 'اوامر':
                const menu = `⚔️ *أهلاً بك يا قائد رين (فراس)* ⚔️\n\n` +
                             `📜 *.اوامر* : عرض هذه القائمة\n` +
                             `📢 *.منشن* : منشن شامل للمجموعة\n` +
                             `🚫 *.طرد* : استبعاد (بالرد على الرسالة)\n` +
                             `🗑️ *.حذف* : مسح رسالة (بالرد عليها)\n` +
                             `🔗 *.رابط* : رابط المجموعة\n` +
                             `⚡ *.بوت* : فحص حالة السيرفر\n\n` +
                             `🛡️ *نظام الحماية:* مفعل (أوامرك فقط)`;
                await sock.sendMessage(from, { text: menu });
                break;

            case 'بوت':
                await sock.sendMessage(from, { text: "🚀 الحالة: متصل\n📍 السيرفر: Render Cloud\n⚙️ النظام: RITZ-V1.0" });
                break;

            case 'رين':
                await sock.sendMessage(from, { text: "نعم يا قائد، أنا في الخدمة! ⚔️🔥" });
                break;

            case 'منشن':
                if (from.endsWith('@g.us')) {
                    const group = await sock.groupMetadata(from);
                    const mentions = group.participants.map(p => p.id);
                    let text = "📣 *نداء من القائد رين للجميع:*\n\n";
                    mentions.forEach(m => text += `@${m.split('@')[0]} `);
                    await sock.sendMessage(from, { text, mentions });
                }
                break;
        }
    });
}

startRitzSystem();

