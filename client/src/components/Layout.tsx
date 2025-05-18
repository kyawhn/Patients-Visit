import { ReactNode } from "react";
import BottomNavigation from "./BottomNavigation";
import PageHeader from "./PageHeader";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      <PageHeader />
      <main className="mt-16 mb-16 px-4 flex-1">
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
}
