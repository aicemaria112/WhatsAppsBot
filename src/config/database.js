/**
 * Database configuration module
 * Handles SQLite database setup and provides connection
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, '../../data/whatsapp.db');
        this.db = null;
    }

    /**
     * Initialize the database connection and create tables if they don't exist
     */
    async initialize() {
        try {
            // Ensure the database connection is established
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Error connecting to database:', err.message);
                    throw err;
                }
                console.log('✅ Connected to SQLite database');
            });

            // Create tables if they don't exist
            await this.createTables();
            return true;
        } catch (error) {
            console.error('❌ Database initialization error:', error);
            return false;
        }
    }

    /**
     * Create necessary tables in the database
     */
    createTables() {
        return new Promise((resolve, reject) => {
            const subscribersTable = `
                CREATE TABLE IF NOT EXISTS subscribers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    whatsapp_id TEXT UNIQUE,
                    phone_number TEXT,
                    first_message TEXT,
                    subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            const messagesTable = `
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    whatsapp_id TEXT,
                    message TEXT,
                    received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (whatsapp_id) REFERENCES subscribers(whatsapp_id)
                )
            `;

            this.db.serialize(() => {
                this.db.run(subscribersTable, (err) => {
                    if (err) {
                        console.error('❌ Error creating subscribers table:', err.message);
                        reject(err);
                        return;
                    }
                    console.log('✅ Subscribers table ready');
                });

                this.db.run(messagesTable, (err) => {
                    if (err) {
                        console.error('❌ Error creating messages table:', err.message);
                        reject(err);
                        return;
                    }
                    console.log('✅ Messages table ready');
                    resolve();
                });
            });
        });
    }

    /**
     * Add a new subscriber to the database
     * @param {string} whatsappId - The WhatsApp ID of the user
     * @param {string} phoneNumber - The phone number of the user
     * @param {string} firstMessage - The first message sent by the user
     * @returns {Promise<boolean>} - Whether the operation was successful
     */
    addSubscriber(whatsappId, phoneNumber, firstMessage) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT OR IGNORE INTO subscribers (whatsapp_id, phone_number, first_message)
                VALUES (?, ?, ?)
            `;

            this.db.run(query, [whatsappId, phoneNumber, firstMessage], function(err) {
                if (err) {
                    console.error('❌ Error adding subscriber:', err.message);
                    reject(err);
                    return;
                }
                
                console.log(`✅ Subscriber added or already exists: ${whatsappId}`);
                resolve(true);
            });
        });
    }

    /**
     * Log a message from a user
     * @param {string} whatsappId - The WhatsApp ID of the user
     * @param {string} message - The message content
     * @returns {Promise<boolean>} - Whether the operation was successful
     */
    logMessage(whatsappId, message) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO messages (whatsapp_id, message)
                VALUES (?, ?)
            `;

            this.db.run(query, [whatsappId, message], function(err) {
                if (err) {
                    console.error('❌ Error logging message:', err.message);
                    reject(err);
                    return;
                }
                
                console.log(`✅ Message logged for: ${whatsappId}`);
                resolve(true);
            });
        });
    }

    /**
     * Get all subscribers from the database
     * @returns {Promise<Array>} - Array of subscriber objects
     */
    getAllSubscribers() {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM subscribers';

            this.db.all(query, [], (err, rows) => {
                if (err) {
                    console.error('❌ Error getting subscribers:', err.message);
                    reject(err);
                    return;
                }
                
                resolve(rows);
            });
        });
    }

    /**
     * Close the database connection
     */
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('❌ Error closing database:', err.message);
                    return;
                }
                console.log('✅ Database connection closed');
            });
        }
    }
}

module.exports = new Database();