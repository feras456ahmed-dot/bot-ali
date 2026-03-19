const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    fetchLatestBaileysVersion,
    DisconnectReason 
} = require("@whiskeysockets/baileys");
const pino = require("pino");

async function startRitzBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_ritz');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ["RITZ-BOT", "Chrome", "20.0.04"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startRitzBot();
        } else if (connection === 'open') {
            console.log("✅ تم تشغيل بوت RITZ بنجاح على السحاب!");
        }
    });

    // --- قسم معالجة الرسائل والأوامر ---
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        const m = chatUpdate.messages[0];
        if (!m.message || m.key.fromMe) return;

        const from = m.key.remoteJid;
        const body = m.message.conversation || m.message.extendedTextMessage?.text || "";
        const isGroup = from.endsWith('@g.us');

        // أمر استعراض الأوامر
        if (body === '.اوامر') {
            const menu = `⚔️ *قائمة أوامر نقابة RITZ* ⚔️\n\n` +
                         `📜 *.اوامر* : لعرض هذه القائمة\n` +
                         `📢 *.منشن* : تاغ لجميع أعضاء الجروب\n` +
                         `🔗 *.رابط* : الحصول على رابط المجموعة\n` +
                         `🤖 *.رين* : رسالة خاصة من قائد النقابة\n\n` +
                         `👤 *المطور:* Rin (فراس)`;
            await sock.sendMessage(from, { text: menu });
        }

        // أمر المنشن (للجروبات فقط)
        if (body === '.منشن' && isGroup) {
            const groupMetadata = await sock.groupMetadata(from);
            const participants = groupMetadata.participants;
            let text = `📣 *نداء من نقابة RITZ لجميع الأعضاء:*\n\n`;
            for (let mem of participants) { text += `@${mem.id.split('@')[0]} `; }
            await sock.sendMessage(from, { text: text, mentions: participants.map(a => a.id) });
        }

        // أمر الرابط
        if (body === '.رابط' && isGroup) {
            const code = await sock.groupInviteCode(from);
            await sock.sendMessage(from, { text: `🔗 رابط مجموعتنا:\nhttps://chat.whatsapp.com/${code}` });
        }

        // أمر ترحيبي خاص بلقبك
        if (body === '.رين') {
            await sock.sendMessage(from, { text: `أهلاً بك يا قائد **رين** (فراس). نقابة RITZ تحت أمرك دائماً! ⚔️🔥` });
        }
    });
}

startRitzBot();

