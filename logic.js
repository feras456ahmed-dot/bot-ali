const moment = require('moment');
const fs = require('fs');

// جلب العداد من ملف خارجي لضمان عدم التصفير عند إعادة التشغيل
let counterFile = 'counter.txt';
let counter = fs.existsSync(counterFile) ? parseInt(fs.readFileSync(counterFile)) : 100;

module.exports = {
    /**
     * وظيفة استخراج البيانات:
     * تبحث عن النص الموجود بين علامتي " " بعد كل خانة
     */
    extractData: (text) => {
        // Regex: يبحث عن النص المكتوب بين " " بعد كلمة لقبك
        const nicknameMatch = text.match(/﴿\s*لــقــبــك\s*🩸\s*﴾\s*"([^"]*)"/);
        // Regex: يبحث عن النص المكتوب بين " " بعد كلمة من طرف
        const sideMatch = text.match(/﴿\s*من\s*طرف\s*✉️\s*﴾\s*"([^"]*)"/);
        
        // استخراج القيم (إذا لم يجد علامات تنصيص سيضع نصاً افتراضياً)
        const name = nicknameMatch ? nicknameMatch[1].trim() : "غير محدد";
        const from = sideMatch ? sideMatch[1].trim() : "مجهول";

        // تجهيز البيانات النهائية
        const data = {
            name: name,
            from: from,
            date: moment().format('YYYY/MM/DD'),
            num: counter
        };

        // زيادة العداد وحفظه للمرة القادمة
        counter++;
        fs.writeFileSync(counterFile, counter.toString());
        
        return data;
    }
};

