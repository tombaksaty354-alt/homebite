import { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ToastNotification from "@/components/ToastNotification";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <ErrorBoundary>
      <div className="d-flex flex-column min-vh-100">
        <Navbar />
        <main className="flex-grow-1">{children}</main>
        <Footer />
        <ToastNotification />
      </div>
    </ErrorBoundary>
  );
}
