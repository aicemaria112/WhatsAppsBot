const whatsappService = require('./src/services/whatsappService');
const database = require('./src/config/database');
const apiServer = require('./src/api/server');
const fs = require('fs');
const path = require('path');

class WhatsAppBot {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            console.log('🚀 Initializing WhatsApp Bot...');
            
            // Create data directory if it doesn't exist
            await this.ensureDataDirectory();
            
            // Initialize database
            const dbInitialized = await database.initialize();
            if (!dbInitialized) {
                console.error('❌ Failed to initialize database');
                return false;
            }
            
            // Initialize WhatsApp service
            const whatsappInitialized = whatsappService.initialize();
            if (!whatsappInitialized) {
                console.error('❌ Failed to initialize WhatsApp service');
                return false;
            }
            
            // Start API server
            const serverStarted = await apiServer.start();
            if (!serverStarted) {
                console.error('❌ Failed to start API server');
                return false;
            }
            
            console.log('✅ WhatsApp Bot initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Error initializing application:', error);
            return false;
        }
    }
    
    /**
     * Ensure data directory exists
     */
    async ensureDataDirectory() {
        try {
            if (!fs.existsSync(this.dataDir)) {
                fs.mkdirSync(this.dataDir, { recursive: true });
                console.log('✅ Created data directory');
            }
            return true;
        } catch (error) {
            console.error('❌ Error creating data directory:', error);
            return false;
        }
    }
    
    /**
     * Gracefully shutdown the application
     */
    shutdown() {
        try {
            console.log('🛑 Shutting down WhatsApp Bot...');
            
            // Close database connection
            database.close();
            
            // Stop API server
            apiServer.stop();
            
            console.log('✅ WhatsApp Bot shutdown complete');
        } catch (error) {
            console.error('❌ Error during shutdown:', error);
        }
    }
}

// Create and initialize the bot
const bot = new WhatsAppBot();

// Handle graceful shutdown
process.on('SIGINT', () => {
    bot.shutdown();
    process.exit(0);
});

process.on('SIGTERM', () => {
    bot.shutdown();
    process.exit(0);
});

// Start the application
bot.initialize().catch(error => {
    console.error('❌ Fatal error during initialization:', error);
    process.exit(1);
});