import ProtectedLayoutWithSidebar from "./layout-with-sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedLayoutWithSidebar>{children}</ProtectedLayoutWithSidebar>;
}
