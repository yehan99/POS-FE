export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
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
};
