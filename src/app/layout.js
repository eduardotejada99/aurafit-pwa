import './globals.css';

export const metadata = {
  title: 'AuraFit PWA - Biohacking & Entrenamiento Híbrido',
  description: 'Hábitos diarios, nutrición con cálculo Lean Bulk, Damage Control y entrenamientos adaptativos.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AuraFit'
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0A0E1A'
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon-precomposed" sizes="180x180" href="/apple-touch-icon-precomposed.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon.png" />
      </head>
      <body>
        <div className="mobile-shell">
          {children}
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then((reg) => {
                    // Force an update check on startup
                    reg.update().catch(() => {});

                    // Check for updates every 5 minutes
                    setInterval(() => {
                      reg.update().catch(() => {});
                    }, 5 * 60 * 1000);

                    // Check on visibility change (when user returns to app)
                    document.addEventListener('visibilitychange', () => {
                      if (document.visibilityState === 'visible') {
                        reg.update().catch(() => {});
                      }
                    });

                    // Listen for new worker installed
                    reg.addEventListener('updatefound', () => {
                      const newWorker = reg.installing;
                      if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            window.dispatchEvent(new CustomEvent('aurafit_update_ready'));
                          }
                        });
                      }
                    });
                  }).catch(err => {
                    console.log('SW registration error:', err);
                  });

                  navigator.serviceWorker.addEventListener('controllerchange', () => {
                    window.dispatchEvent(new CustomEvent('aurafit_updated'));
                  });
                });
              }
            `
          }}
        />
      </body>
    </html>
  );
}
