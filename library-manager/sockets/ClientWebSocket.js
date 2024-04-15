const { WebSocket } = require('ws');

const wss = new WebSocket.Server({ port: 8087 });

function sendSignal() {
    // console.log("Will send signal...");
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({}));
        }
    });
}

wss.on('connection', (ws) => {
    ws.on('close', () => {
    });
});

module.exports = { sendSignal };