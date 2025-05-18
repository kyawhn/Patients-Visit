import { useLocation, Link } from "wouter";
import { Home, Users, CalendarDays, FileText, Settings } from "lucide-react";

export default function BottomNavigation() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const getNavItemClasses = (path: string) => {
    return `bottom-nav-item flex flex-col items-center p-1 flex-1 ${
      isActive(path) 
        ? "text-primary font-medium" 
        : "text-neutral-500"
    }`;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white flex justify-around items-center py-2 shadow-lg border-t border-neutral-200 z-10">
      <Link href="/" className={getNavItemClasses("/")}>
        <Home className="h-5 w-5" />
        <span className="text-xs mt-1">Dashboard</span>
      </Link>
      <Link href="/patients" className={getNavItemClasses("/patients")}>
        <Users className="h-5 w-5" />
        <span className="text-xs mt-1">Patients</span>
      </Link>
      <Link href="/calendar" className={getNavItemClasses("/calendar")}>
        <CalendarDays className="h-5 w-5" />
        <span className="text-xs mt-1">Calendar</span>
      </Link>
      <Link href="/records" className={getNavItemClasses("/records")}>
        <FileText className="h-5 w-5" />
        <span className="text-xs mt-1">Records</span>
      </Link>
      <Link href="/settings" className={getNavItemClasses("/settings")}>
        <Settings className="h-5 w-5" />
        <span className="text-xs mt-1">Settings</span>
      </Link>
    </nav>
  );
}
