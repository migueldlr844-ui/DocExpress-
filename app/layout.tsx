export const metadata = {import './globals.css';

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
      <body>{children}</body>
    </html>
  );
}
