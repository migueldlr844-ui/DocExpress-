import React from 'react';
import './globals.css';

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
    <html lang="fr">
      <body>
        {children}
      </body>
    </html>
  );
}
