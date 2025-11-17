const crypto = require('crypto');
const { RtcTokenBuilder } = require('agora-token');

const AGORA_CONFIG = {
    APP_ID: '1a9f54c08e84434bb88fd5d366942cd8',
    APP_CERTIFICATE: 'd0f6b43b73f343aa93ede05760607b9a',
    TOKEN_EXPIRATION_TIME: 3600 // 1 hour in seconds
};
// 0f2594c4fb6b4a9f93845b4845fbf831    p
// d0f6b43b73f343aa93ede05760607b9a    s
/**
 * Generate Agora RTC token using UID
 * @param {string} channelName
 * @param {number|string} uid
 * @param {number} role
 * @param {number} expirationTime
 * @returns {string}
 */
function generateAgoraToken(channelName, userId, advisorId, role = 2, expirationTime = AGORA_CONFIG.TOKEN_EXPIRATION_TIME) {
    try {
        const appId = AGORA_CONFIG.APP_ID;
        const appCertificate = AGORA_CONFIG.APP_CERTIFICATE;

        if (!appId || !appCertificate) {
            throw new Error('Agora App ID and App Certificate must be configured properly');
        }

        if (!channelName) {
            throw new Error('Channel name is required to generate Agora token');
        }
        const userRole = 1;
        const advisoreRole = 2;

        const tokenExpirationInSecond = expirationTime || AGORA_CONFIG.TOKEN_EXPIRATION_TIME;
        const privilegeExpirationInSecond = expirationTime || AGORA_CONFIG.TOKEN_EXPIRATION_TIME;

        const userToken = RtcTokenBuilder.buildTokenWithUid(
            appId,
            appCertificate,
            channelName,
            parseInt(userId),
            userRole,
            privilegeExpirationInSecond
        );

        const advisorToken = RtcTokenBuilder.buildTokenWithUid(
            appId,
            appCertificate,
            channelName,
            parseInt(advisorId),
            advisoreRole,
            privilegeExpirationInSecond
        );

        return {
            userToken,
            advisorToken
        };

    } catch (error) {
        console.error('Error generating Agora token:', error);
        throw new Error('Failed to generate Agora access token');
    }
}

/**
 * Generate unique Agora channel name
 * @param {number|string} sessionId
 * @param {number|string} mentorId
 * @param {number|string} menteeId
 * @returns {string}
 */
function generateAgoraChannelName(sessionId, mentorId, menteeId) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(4).toString('hex');
    return `session_${randomString}`;
}

module.exports = {
    generateAgoraToken,
    generateAgoraChannelName,
    AGORA_CONFIG
};
