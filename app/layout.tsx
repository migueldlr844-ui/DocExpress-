import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DocExpress Cameroun',
  description: 'Génération de documents administratifs et juridiques au Cameroun',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#020617',
          color: '#f8fafc',
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
          minHeight: '100vh',
        }}
      >
        {children}
      </body>
    </html>
  );
}
