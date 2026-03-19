const { default: makeWASocket, useMultiFileAuthState, delay, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");

async function startRitzBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_ritz');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // --- الربط المباشر برقم هاتفك يا رين ---
    if (!sock.authState.creds.registered) {
        console.log("⏳ جاري طلب كود الربط لرقمك: 967737266081...");
        await delay(5000); // مهلة استقرار
        try {
            const code = await sock.requestPairingCode("967737266081");
            console.log(`\n🚀 كود الربط الخاص بك هو: ${code.match(/.{1,4}/g)?.join("-") || code}\n`);
        } catch (err) {
            console.log("❌ فشل الطلب، انتظر دقيقة وأعد المحاولة.");
        }
    }

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') console.log("✅ تم تشغيل بوت RITZ بنجاح!");
        if (connection === 'close') startRitzBot();
    });
}
startRitzBot();

