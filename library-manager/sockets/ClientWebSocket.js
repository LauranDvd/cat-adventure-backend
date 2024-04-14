const { WebSocket } = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

function sendSignal() {
    console.log("Will send signal...");
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({}));
        }
    });
}

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

module.exports = { sendSignal };