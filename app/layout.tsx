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
      <head>
        <style>{`
          body {
            background-color: #f8fafc !important;
            color: #0f172a !important;
            font-family: system-ui, -apple-system, sans-serif !important;
            margin: 0;
            padding: 0;
          }
          header {
            background-color: #1e3a8a !important;
            color: white !important;
          }
          h1, h2, h3, h4, p, span {
            color: #0f172a !important;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
