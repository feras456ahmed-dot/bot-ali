const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    PHONENUMBER_MCC
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const NodeCache = require("node-cache");
const readline = require("readline");

// إعداد واجهة إدخال رقم الهاتف
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startRitzBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_ritz');
    const msgRetryCounterCache = new NodeCache();

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // سنستخدم كود الربط بدلاً من QR
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.creds, pino({ level: 'silent' })),
        },
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        msgRetryCounterCache
    });

    // منطق كود الربط (Pairing Code)
    if (!sock.authState.creds.registered) {
        console.log("⚠️ لم يتم العثور على جلسة، جاري طلب كود الربط...");
        const phoneNumber = await question('أدخل رقم هاتفك مع رمز الدولة (مثال: 967xxxxxxxxx): ');
        const code = await sock.requestPairingCode(phoneNumber.trim());
        console.log(`🚀 كود الربط الخاص بك هو: ${code}`);
        console.log("افتح الواتساب > الأجهزة المرتبطة > ربط باستخدام رقم الهاتف، وأدخل الكود أعلاه.");
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            console.log("❌ انقطع الاتصال، جاري إعادة التشغيل...");
            startRitzBot();
        } else if (connection === 'open') {
            console.log("✅ تم تشغيل بوت RITZ بنجاح على السيرفر!");
        }
    });

    // استماع الرسائل (أوامر نقابة RITZ)
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message) return;
            const content = m.message.conversation || m.message.extendedTextMessage?.text;
            const from = m.key.remoteJid;

            if (content === '.اوامر') {
                await sock.sendMessage(from, { text: '⚔️ قائمة أوامر نقابة RITZ قيد التطوير...' });
            }
        } catch (err) {
            console.error(err);
        }
    });
}

startRitzBot();

