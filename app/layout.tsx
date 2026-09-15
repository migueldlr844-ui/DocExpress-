import './globals.css';

export const metadata = {
  title: 'DocExpress',
  description: 'Génération de documents administratifs',
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
