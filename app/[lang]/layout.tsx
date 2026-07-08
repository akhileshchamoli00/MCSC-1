export function generateStaticParams() {
  return [{ lang: "en" }, { lang: "id" }, { lang: "cn" }];
}

export default function LangRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
