/**
 * WhatsApp Service
 * Handles all WhatsApp client functionality with proper error handling
 */
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const database = require('../config/database');

class WhatsAppService {
    constructor() {
        this.client = null;
        this.isReady = false;
    }

    /**
     * Initialize the WhatsApp client
     */
    initialize() {
        try {
            // Create a new WhatsApp client instance
            this.client = new Client({
                authStrategy: new LocalAuth(),
                // Add additional options for stability
                puppeteer: {
                    args: ['--no-sandbox', '--disable-setuid-sandbox'],
                }
            });

            // Set up event handlers
            this.setupEventHandlers();

            // Initialize the client
            this.client.initialize().catch(error => {
                console.error('❌ Error initializing WhatsApp client:', error);
            });

            return true;
        } catch (error) {
            console.error('❌ Error setting up WhatsApp client:', error);
            return false;
        }
    }

    /**
     * Set up event handlers for the WhatsApp client
     */
    setupEventHandlers() {
        // QR code event
        this.client.on('qr', (qr) => {
            try {
                console.log('Escanea este QR con el número del bot:');
                qrcode.generate(qr, { small: true });
            } catch (error) {
                console.error('❌ Error generating QR code:', error);
            }
        });

        // Ready event
        this.client.on('ready', () => {
            try {
                this.isReady = true;
                console.log('✅ Bot está listo!');
            } catch (error) {
                console.error('❌ Error in ready event:', error);
            }
        });

        // Disconnected event
        this.client.on('disconnected', (reason) => {
            try {
                this.isReady = false;
                console.log('❌ Bot desconectado:', reason);
                // Attempt to reconnect
                this.client.initialize().catch(error => {
                    console.error('❌ Error reconnecting WhatsApp client:', error);
                });
            } catch (error) {
                console.error('❌ Error handling disconnection:', error);
            }
        });

        // Message event
        this.client.on('message', async (msg) => {
            try {
                console.log(`📩 Mensaje recibido de ${msg.from}: ${msg.body}`);
                
                // Extract phone number from the WhatsApp ID
                const phoneNumber = msg.from.split('@')[0];
                
                // Store the subscriber in the database
                await database.addSubscriber(msg.from, phoneNumber, msg.body);
                
                // Log the message in the database
                await database.logMessage(msg.from, msg.body);
                
                // Handle commands
                await this.handleCommands(msg);
            } catch (error) {
                console.error('❌ Error processing message:', error);
            }
        });

        // Authentication failure event
        this.client.on('auth_failure', (error) => {
            console.error('❌ Authentication failed:', error);
        });
    }

    /**
     * Handle message commands
     * @param {Object} msg - The message object
     */
    async handleCommands(msg) {
        try {
            const command = msg.body.toLowerCase();

            if (command === 'hola') {
                await msg.reply('¡Hola! Soy un bot de WhatsApp 🤖');
            } else if (command === '!info') {
                await msg.reply('Aquí está tu info:\n' + JSON.stringify(msg, null, 2));
            } else if (command === '!ayuda' || command === '!help') {
                await msg.reply('Comandos disponibles:\n- hola: Saludo\n- !info: Ver información del mensaje\n- !ayuda: Ver esta ayuda');
            }
        } catch (error) {
            console.error('❌ Error handling commands:', error);
        }
    }

    /**
     * Send a message to a specific WhatsApp ID
     * @param {string} to - The WhatsApp ID to send the message to
     * @param {string} message - The message to send
     * @returns {Promise<boolean>} - Whether the message was sent successfully
     */
    async sendMessage(to, message) {
        try {
            if (!this.isReady) {
                console.error('❌ WhatsApp client not ready');
                return false;
            }

            await this.client.sendMessage(to, message);
            console.log(`✅ Message sent to ${to}`);
            return true;
        } catch (error) {
            console.error(`❌ Error sending message to ${to}:`, error);
            return false;
        }
    }

    /**
     * Broadcast a message to all subscribers
     * @param {string} message - The message to broadcast
     * @returns {Promise<{success: number, failed: number}>} - Count of successful and failed sends
     */
    async broadcastMessage(message) {
        try {
            if (!this.isReady) {
                console.error('❌ WhatsApp client not ready');
                return { success: 0, failed: 0 };
            }

            const subscribers = await database.getAllSubscribers();
            let success = 0;
            let failed = 0;

            for (const subscriber of subscribers) {
                try {
                    await this.client.sendMessage(subscriber.whatsapp_id, message);
                    success++;
                    console.log(`✅ Broadcast message sent to ${subscriber.whatsapp_id}`);
                } catch (error) {
                    failed++;
                    console.error(`❌ Error sending broadcast to ${subscriber.whatsapp_id}:`, error);
                }
            }

            return { success, failed };
        } catch (error) {
            console.error('❌ Error broadcasting message:', error);
            return { success: 0, failed: 0 };
        }
    }
}

module.exports = new WhatsAppService();