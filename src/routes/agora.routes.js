const express = require('express');
const router = express.Router();
const { RtcTokenBuilder } = require('agora-token');

// Generate RTC Token for Agora
router.post('/generateRtcToken', (req, res) => {
    try {
        // Get parameters
        const { channelName } = req.body;

        // Validate required parameters
        if (!channelName) {
            return res.status(400).json({
                success: false,
                error: 'channelName is required'
            });
        }

        // Get Agora configuration from environment variables
        const appID = '1a9f54c08e84434bb88fd5d366942cd8';
        const appCertificate = '0f2594c4fb6b4a9f93845b4845fbf831';

        if (!appID || !appCertificate) {
            return res.status(500).json({
                success: false,
                error: 'Agora configuration not found. Please set AGORA_APP_ID and AGORA_APP_CERTIFICATE in environment variables.'
            });
        }

        // Generate the token
        const token = RtcTokenBuilder.buildTokenWithUid(
            appID,
            appCertificate,
            channelName
        );

        // Return success response
        res.json({
            success: true,
            token: token,
            channelName: channelName
        });

    } catch (error) {
        console.error('Error generating RTC token:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while generating token'
        });
    }
});

module.exports = router;
