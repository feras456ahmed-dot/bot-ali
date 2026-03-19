const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys")
const qrcode = require('qrcode-terminal')
const pino = require('pino')

async function fetchJID() {
    const { state, saveCreds } = await useMultiFileAuthState('session_auth')
    const { version } = await fetchLatestBaileysVersion()
    
    const sock = makeWASocket({
        auth: state,
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false 
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, qr } = update

        if (qr) {
            console.log("\n--- امسح الكود التالي ---")
            qrcode.generate(qr, { small: true })
        }

        if (connection === 'open') {
            console.log("\n✅ متصل بنجاح!\n")
            
            // تأكد من وجود الفاصلة بين الروابط
            const links = [
                "DK1ZjPIPqd10bjdWJlBpvR", 
                "Kr1OxzsWASBERBII5H0oFu", 
                "KBeGfC1AoDI5P3I2wzqgIp",
                "FElAdgI45Hr1879c5ihp9H"  // رابط الوورك
            ]

            for (let code of links) {
                try {
                    const group = await sock.groupGetInviteInfo(code)
                    console.log(`📌 القروب: ${group.subject}`)
                    console.log(`🆔 الـ ID: ${group.id}`)
                    console.log("------------------------------")
                } catch (e) {
                    console.log(`❌ فشل في الرابط: ${code}`)
                }
            }
            process.exit()
        }
    })
}

fetchJID()

