const express = require('express');
const router = express.Router();
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

// Generate RTC Token for Agora
router.post('/generateRtcToken', (req, res) => {
    try {
        // Get parameters
        const { channelName, role } = req.body;
        const { privilegeExpiredTs = 3600 } = req.query;

        // Validate required parameters
        if (!channelName) {
            return res.status(400).json({
                success: false,
                error: 'channelName is required'
            });
        }

        // Generate unique UID
        const uid = Math.floor(Math.random() * 1000000) + 1; // Generate random UID between 1 and 1000000

        // Get Agora configuration from environment variables
        const appID = '1a9f54c08e84434bb88fd5d366942cd8';
        const appCertificate = '0f2594c4fb6b4a9f93845b4845fbf831';

        if (!appID || !appCertificate) {
            return res.status(500).json({
                success: false,
                error: 'Agora configuration not found. Please set AGORA_APP_ID and AGORA_APP_CERTIFICATE in environment variables.'
            });
        }



        // Determine role (1 = adviser/publisher, 2 = user/subscriber)
        const rtcRole = role === 2 ? 'user' : 'adviser';

        // Calculate privilege expired time
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTsNum = parseInt(privilegeExpiredTs);
        const expirationTimestamp = currentTimestamp + privilegeExpiredTsNum;

        // Generate the token
        const token = RtcTokenBuilder.buildTokenWithUid(
            appID,
            appCertificate,
            channelName,
            uid,
            rtcRole,
            expirationTimestamp
        );

        // Return success response
        res.json({
            success: true,
            token: token,
            appID: appID,
            channelName: channelName,
            uid: uid,
            role: role === 1 ? 'adviser' : 'user',
            privilegeExpiredTs: privilegeExpiredTsNum,
            expirationTimestamp: expirationTimestamp
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
