const config = require('./config');
const logic = require('./logic');

module.exports = async (sock, m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const sender = msg.key.participant || from;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

    // 1. معالجة الاستمارة عند إرسالها (البحث عن علامات التنصيص)
    if (from === config.ids.reception && text.includes("﴿ لــقــبــك 🩸﴾")) {
        const data = logic.extractData(text);

        // أ: الرد في العام
        await sock.sendMessage(from, { text: "> خاصك لو تكرمت", edit: msg.key });

        // ب: رسالة الخاص
        await sock.sendMessage(sender, { text: `┇⚡ أهلاً بك في نقابة RITZ ⚡\n🔗 رابط الانضمام ↫\n${config.links.sat}?mode=gi_t` });

        // ج: رسالة الترحيب النهائي (السات)
        const mainMsg = `⌬∙ • ──╾⊱﹝﷽﹞⊰╼── • ∙⌬\n┇🩸 أهلاً بك في نقابة RITZ 🩸┇\n👤⊱اللقب ┋ ${data.name} ┆\n📌⊱المنشن ┋ @${sender.split('@')[0]} ┆\n\n> ✿↫ نرحب بك في عالم سبارتا، حيث القوة والتحدي 🩸⚡\n> ✿↫ أنت الآن جزء من نخبة RITZ، استعد لإثبات نفسك 👑🔥\n\n✘· • • ─━ ╃✦⊰ 🩸⊱✦╄ ━─ • • · ✘\n🔗 رابط الانضمام ↫\n${config.links.ads}?mode=gi_t\n✘· • • ─━ ╃✦⊰ 🩸⊱✦╄ ━─ • • · ✘\n🩸⃝ ╏⟐ 𝑺•𝑨•𝑻 ⊰⚡️⊱ 𝑹𝑰𝑻𝒁 ⟐`;
        await sock.sendMessage(config.ids.main, { text: mainMsg, mentions: [sender] });

        // د: استمارة العضوية لقروب الوورك
        const workMsg = `┇🩸┊استمارة العضوية ↶\n⟐━─⧉━〔🩸〕━⧉─━⟐\n✘┋اللقب  【${data.name}】 ↯\n✘┋من طــرف【${data.from}】 ↯\n✘┋العدد 【${data.num}】 ↯\n✘┋التاريخ /【${data.date}】 ↯\n✘┋المسؤول /【${config.adminName}】 ↯\n⊱───═⪨༻【🩸】༺⪩═───⊰`;
        await sock.sendMessage(config.ids.work, { text: workMsg });
    }

    // 2. أمر القوانين
    if (text === ".القوانين") {
        await sock.sendMessage(from, { text: config.messages.laws });
    }
};

