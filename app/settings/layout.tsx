import Header from "@/components/site-header";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex justify-center w-full">{children}</main>
    </>
  );
}
