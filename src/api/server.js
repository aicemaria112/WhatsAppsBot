/**
 * API Server
 * Handles HTTP endpoints for the WhatsApp bot
 */
const express = require('express');
const bodyParser = require('body-parser');
const whatsappService = require('../services/whatsappService');

class ApiServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.setupMiddleware();
        this.setupRoutes();
    }

    /**
     * Set up middleware for the Express app
     */
    setupMiddleware() {
        try {
            // Parse JSON request bodies
            this.app.use(bodyParser.json());
            // Parse URL-encoded request bodies
            this.app.use(bodyParser.urlencoded({ extended: true }));
        } catch (error) {
            console.error('❌ Error setting up middleware:', error);
        }
    }

    /**
     * Set up API routes
     */
    setupRoutes() {
        try {
            // Root endpoint
            this.app.get('/', (req, res) => {
                res.json({ status: 'WhatsApp Bot API is running' });
            });

            // Broadcast message endpoint
            this.app.post('/api/broadcast', async (req, res) => {
                try {
                    const { message } = req.body;

                    if (!message) {
                        return res.status(400).json({ 
                            success: false, 
                            error: 'Message is required' 
                        });
                    }

                    const result = await whatsappService.broadcastMessage(message);
                    
                    return res.json({
                        success: true,
                        message: 'Broadcast sent',
                        stats: result
                    });
                } catch (error) {
                    console.error('❌ Error in broadcast endpoint:', error);
                    return res.status(500).json({ 
                        success: false, 
                        error: 'Failed to send broadcast message' 
                    });
                }
            });

            // Send message to specific user endpoint
            this.app.post('/api/send', async (req, res) => {
                try {
                    const { to, message } = req.body;

                    if (!to || !message) {
                        return res.status(400).json({ 
                            success: false, 
                            error: 'Both "to" and "message" are required' 
                        });
                    }

                    const success = await whatsappService.sendMessage(to, message);
                    
                    if (success) {
                        return res.json({
                            success: true,
                            message: 'Message sent successfully'
                        });
                    } else {
                        return res.status(500).json({ 
                            success: false, 
                            error: 'Failed to send message' 
                        });
                    }
                } catch (error) {
                    console.error('❌ Error in send message endpoint:', error);
                    return res.status(500).json({ 
                        success: false, 
                        error: 'Failed to send message' 
                    });
                }
            });

            // Error handling for undefined routes
            this.app.use((req, res) => {
                res.status(404).json({ 
                    success: false, 
                    error: 'Endpoint not found' 
                });
            });
        } catch (error) {
            console.error('❌ Error setting up routes:', error);
        }
    }

    /**
     * Start the API server
     */
    start() {
        try {
            return new Promise((resolve) => {
                this.server = this.app.listen(this.port, () => {
                    console.log(`✅ API server running on port ${this.port}`);
                    resolve(true);
                });
            });
        } catch (error) {
            console.error('❌ Error starting API server:', error);
            return Promise.resolve(false);
        }
    }

    /**
     * Stop the API server
     */
    stop() {
        try {
            if (this.server) {
                this.server.close();
                console.log('✅ API server stopped');
            }
        } catch (error) {
            console.error('❌ Error stopping API server:', error);
        }
    }
}

module.exports = new ApiServer();