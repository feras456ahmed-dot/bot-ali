const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino"); // استيراد pino
const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

let sock;
let pairingCode = "لم يتم طلب كود بعد";

// --- واجهة المتصفح النيون ---
app.get('/', (req, res) => {
    const number = req.query.number;
    if (number) {
        requestPairing(number.replace(/[^0-9]/g, '')); // تنظيف الرقم من أي رموز
        res.send(`
            <body style="background: #0f0f1b; color: #00f2ff; font-family: sans-serif; text-align: center; padding-top: 50px;">
                <h2 style="text-shadow: 0 0 10px #00f2ff;">⏳ جاري طلب الكود للرقم: ${number}</h2>
                <p>انتظر 10 ثواني ثم <a href="/" style="color: #ff0055; text-decoration: none; font-weight: bold;">[ اضغط هنا لتحديث الصفحة ]</a></p>
            </body>
        `);
    } else {
        res.send(`
            <body style="background: #0f0f1b; color: #00f2ff; font-family: sans-serif; text-align: center; padding-top: 50px;">
                <h1 style="text-shadow: 0 0 15px #00f2ff;">⚔️ لوحة تحكم نخبة RITZ ⚔️</h1>
                <div style="border: 2px solid #ff0055; display: inline-block; padding: 30px; border-radius: 20px; background: #1a1a2e; box-shadow: 0 0 20px #ff0055;">
                    <h3 style="color: #fff;">كود الربط الحالي:</h3>
                    <h2 style="color: #ff0055; letter-spacing: 8px; font-size: 40px; text-shadow: 0 0 10px #ff0055;">${pairingCode}</h2>
                </div>
                <br><br>
                <form action="/" method="get">
                    <input type="text" name="number" placeholder="مثال: 967737266081" style="padding: 15px; border-radius: 8px; border: 2px solid #00f2ff; background: #000; color: #fff; width: 250px;">
                    <br><br>
                    <button type="submit" style="padding: 12px 30px; background: #00f2ff; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; color: #000;">طلب الكود ⚡</button>
                </form>
                <p style="color: #555;">أدخل رقمك بدون (+) ثم حدث الصفحة بعد الطلب</p>
            </body>
        `);
    }
});

app.listen(port, () => console.log(`🚀 اللوحة جاهزة على المنفذ ${port}`));

async function startBot() {
    // تأكد من مسح مجلد auth_ritz إذا أردت ربط رقم جديد تماماً
    const { state, saveCreds } = await useMultiFileAuthState('auth_ritz');
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }), // تم الإصلاح هنا
        auth: state,
        printQRInTerminal: false,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') {
            console.log("⚔️ البوت متصل الآن!");
            pairingCode = "متصل بنجاح! ✅";
        }
        if (connection === 'close') startBot();
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        const m = chatUpdate.messages[0];
        if (!m.message || m.key.fromMe) return;
        const body = m.message.conversation || m.message.extendedTextMessage?.text || "";
        if (body.trim() === ".بوت") {
            await sock.sendMessage(m.key.remoteJid, { text: "هلا" });
        }
    });
}

// دالة طلب الكود
async function requestPairing(num) {
    try {
        await new Promise(resolve => setTimeout(resolve, 5000));
        let code = await sock.requestPairingCode(num);
        pairingCode = code;
        console.log(`⚔️ تم توليد كود للرقم ${num}: ${code}`);
    } catch (err) {
        console.error(err);
        pairingCode = "فشل! تأكد من الرقم أو حاول لاحقاً";
    }
}

startBot();

