import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DocExpress Cameroun',
  description: 'Service de génération de documents conformes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-[#020617] text-[#f8fafc] min-h-screen">
        {children}
      </body>
    </html>
  );
}
