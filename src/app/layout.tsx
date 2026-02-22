// Root layout - just provides the html structure
// Locale-specific layout is in [locale]/layout.tsx

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
