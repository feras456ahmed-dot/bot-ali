const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    Browsers 
} = require("@whiskeysockets/baileys");
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const welcome = require('./welcome');
const commands = require('./commands');

async function startRitzBot() {
    console.log("⚙️ جاري تحضير نظام نقابة RITZ...");
    
    // جلب أحدث إصدار من واجهة واتساب لتجنب مشاكل الاتصال
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`📡 إصدار الواتساب المستخدم: ${version.join('.')} (أحدث نسخة: ${isLatest})`);

    // إعداد الجلسة وحفظها في مجلد auth_ritz
    const { state, saveCreds } = await useMultiFileAuthState('auth_ritz');

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }), // إخفاء السجلات المزعجة
        printQRInTerminal: false, // سنطبعه يدوياً عبر المكتبة المخصصة
        browser: Browsers.macOS('Desktop'), // تعريف البوت كمتصفح لتجنب كود 405
        syncFullHistory: false,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000, // مهلة اتصال دقيقة كاملة
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000
    });

    // حفظ التغييرات في الجلسة تلقائياً
    sock.ev.on('creds.update', saveCreds);

    // مراقبة حالة الاتصال والـ QR
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        // ظهور كود QR في التيرمنال
        if (qr) {
            console.log("\n⚠️ يجب مسح الكود التالي لربط البوت بنقابة RITZ:");
            qrcode.generate(qr, { small: true });
            console.log("💡 نصيحة: صغّر الخط في Termux إذا لم يظهر الكود كاملاً.\n");
        }

        // عند فتح الاتصال بنجاح
        if (connection === 'open') {
            console.log("\n" + "=".repeat(30));
            console.log("⚔️ تم تفعيل نظام نقابة RITZ بنجاح!");
            console.log("🤖 البوت الآن يراقب المجموعات السبعة...");
            console.log("=".repeat(30) + "\n");
        }

        // عند انقطاع الاتصال
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            console.log(`⚠️ انقطع الاتصال (الكود: ${statusCode})`);

            // إعادة الاتصال التلقائي إلا إذا سجلت الخروج يدوياً
            if (statusCode !== DisconnectReason.loggedOut) {
                console.log("🔄 جاري محاولة إعادة الاتصال في غضون 5 ثوانٍ...");
                setTimeout(() => startRitzBot(), 5000);
            } else {
                console.log("❌ تم تسجيل الخروج. امسح مجلد auth_ritz وأعد التشغيل.");
            }
        }
    });

    // تفعيل نظام الترحيب عند دخول أعضاء جدد
    sock.ev.on('group-participants.update', async (update) => {
        try {
            await welcome(sock, update);
        } catch (err) {
            console.error("❌ خطأ في معالجة الترحيب:", err);
        }
    });

    // تفعيل نظام الأوامر والاستمارات
    sock.ev.on('messages.upsert', async (m) => {
        try {
            await commands(sock, m);
        } catch (err) {
            console.error("❌ خطأ في معالجة الأوامر:", err);
        }
    });
}

// تشغيل المحرك الرئيسي
console.log("🚀 انطلاق...");
startRitzBot().catch(err => {
    console.error("❌ خطأ فادح عند البدء:", err);
});

