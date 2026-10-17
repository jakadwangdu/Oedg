const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const generateAgoraToken = (channelName, uid) => {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  // If no certificate configured, return null (dev mode - use App ID only)
  if (!appCertificate || appCertificate === 'your_agora_certificate') {
    return null;
  }

  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  return RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    parseInt(uid),
    role,
    privilegeExpiredTs
  );
};

module.exports = { generateAgoraToken };
