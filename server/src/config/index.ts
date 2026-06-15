import dotenv from 'dotenv';

dotenv.config();

const renderUrl = process.env.RENDER_EXTERNAL_URL;

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || (renderUrl ? `https://${renderUrl}` : 'http://localhost:5173'),
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  quickbooks: {
    clientId: process.env.QBO_CLIENT_ID || '',
    clientSecret: process.env.QBO_CLIENT_SECRET || '',
    redirectUri: process.env.QBO_REDIRECT_URI || (renderUrl
      ? `https://${renderUrl}/api/auth/callback`
      : 'http://localhost:3001/api/auth/callback'
    ),
    environment: (process.env.QBO_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
  },
};
