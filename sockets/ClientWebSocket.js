const { WebSocket } = require('ws');
const https = require('https');
const fs = require('fs');

const options = {
    key: fs.readFileSync('https/key.pem'),
    cert: fs.readFileSync('https/cert.pem')
};

const httpsServer = https.createServer(options).listen(8087);

const wss = new WebSocket.Server({ server: httpsServer });

// const wss = new WebSocket('ws://localhost:8087');
// const wss = new WebSocket.Server({ port: 8087 });


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