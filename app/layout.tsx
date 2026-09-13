import React from 'react';

export const metadata = {
  title: 'DocExpress',
  description: 'Gestion et génération de documents',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" style={{ margin: 0, padding: 0, width: '100%', maxWidth: '100vw', overflowX: 'hidden', backgroundColor: '#0B132B' }}>
      <body style={{ margin: 0, padding: 0, width: '100%', maxWidth: '100vw', overflowX: 'hidden', backgroundColor: '#0B132B', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  );
}
