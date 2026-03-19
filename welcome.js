const config = require('./config');

module.exports = async (sock, update) => {
    const { id, participants, action } = update;
    if (action === 'add' && id === config.ids.reception) {
        for (let user of participants) {
            await sock.sendMessage(id, { text: config.messages.welcomeForm });
        }
    }
}

