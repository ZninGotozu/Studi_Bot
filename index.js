const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const qrcode = require("qrcode-terminal"); // <=== QR code visual no terminal
const fs = require("fs");
const { join } = require("path");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth");

    const sock = makeWASocket({
        auth: state,
    });

    // Atualização de conexão + QR
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("\n🔐 Escaneie este QR code com o WhatsApp:");
            qrcode.generate(qr, { small: true }); // Mostra o QR em modo texto
        }

        if (connection === "close") {
            const shouldReconnect =
                (lastDisconnect.error = Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log("🔁 Reconectando...");
                startBot();
            } else {
                console.log("📴 Conexão encerrada.");
            }
        } else if (connection === "open") {
            console.log("✅ Bot conectado com sucesso!");
        }
    });

    sock.ev.on("creds.update", saveCreds);

    // Escutando mensagens
    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const text = msg.message.conversation || "";

        if (text.toLowerCase().startsWith("/ping")) {
            await sock.sendMessage(sender, { text: "pong! 🏓" });
        }

        // Outros comandos como /criarcurso virão aqui
    });
}

startBot();
