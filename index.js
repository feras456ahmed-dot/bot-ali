// --- خدعة الـ PORT لإرضاء Render ---
const http = require('http');
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.write('RITZ System is Online ⚔️');
  res.end();
}).listen(port);
// -----------------------------------

const { 
    default: makeWASocket, useMultiFileAuthState, delay, 
    fetchLatestBaileysVersion, DisconnectReason 
} = require("@whiskeysockets/baileys");
const pino = require("pino");

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
            console.log("⚔️ تم تفعيل نظام نقابة RITZ بنجاح!");
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        const m = chatUpdate.messages[0];
        if (!m.message || m.key.fromMe) return;

        const from = m.key.remoteJid;
        const body = m.message.conversation || m.message.extendedTextMessage?.text || "";
        const isGroup = from.endsWith('@g.us');
        const prefix = ".";
        const cmd = body.startsWith(prefix) ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : null;

        if (!cmd) return;

        // --- مصفوفة الأوامر الإدارية (20 أمر) ---
        switch (cmd) {
            case 'اوامر':
                const menu = `⚔️ *قائمة أوامر RITZ الإدارية* ⚔️\n\n` +
                             `1. .طرد | 2. .رفع_مشرف | 3. .تنزيل_مشرف\n` +
                             `4. .قفل | 5. .فتح | 6. .حذف | 7. .منشن\n` +
                             `8. .اسم | 9. .وصف | 10. .رابط | 11. .تحذير\n` +
                             `12. .كتم | 13. .الغاء_الكتم | 14. .تصفية\n` +
                             `15. .تحديث | 16. .اعلان | 17. .حماية\n` +
                             `18. .المغادرين | 19. .احصائيات | 20. .بوت\n\n` +
                             `👤 المطور: رين (فراس)`;
                await sock.sendMessage(from, { text: menu });
                break;

            case 'رين':
                await sock.sendMessage(from, { text: "أهلاً بك يا قائد **رين**. النظام جاهز لتنفيذ أوامرك! ⚔️" });
                break;

            case 'بوت':
                await sock.sendMessage(from, { text: "⚡ الحالة: متصل بالسحاب\n🔋 السرعة: 0.5ms\n🛡️ النظام: RITZ-V1" });
                break;

            // يمكنك إضافة منطق بقية الـ 20 أمراً هنا تدريجياً
        }
    });
}

startRitzSystem();

