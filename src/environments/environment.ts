export const environment = {
  production: false,
  apiUrl: 'http://127.0.0.1:8000/api',
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
    key: 'your-pusher-key',
    cluster: 'ap2',
    encrypted: true,
  },
  stripe: {
    publicKey: 'pk_test_your_stripe_public_key',
  },
  googleClientId:
    '259309339026-co9fvoft6ealhamujj8cbdntlg30rlit.apps.googleusercontent.com',
  googleClientScriptUrl: 'https://accounts.google.com/gsi/client',
  googleClientScriptFallback: '/assets/google/gsi-client.js',
};
