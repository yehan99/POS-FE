export const environment = {
  production: true,
  apiUrl: 'https://api.paradisepos.lk/api',
  appName: 'Paradise POS',
  version: '1.0.0',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'si', 'ta'],
  currency: {
    code: 'LKR',
    symbol: 'Rs.',
    decimal: 2,
  },
  features: {
    offlineMode: true,
    multiLanguage: true,
    hardwareIntegration: true,
    analytics: true,
  },
  pusher: {
    key: 'your-production-pusher-key',
    cluster: 'ap2',
    encrypted: true,
  },
  stripe: {
    publicKey: 'pk_live_your_stripe_public_key',
  },
  googleClientId: 'your-production-google-client-id.apps.googleusercontent.com',
  googleClientScriptUrl: 'https://accounts.google.com/gsi/client',
  googleClientScriptFallback: '/assets/google/gsi-client.js',
};
