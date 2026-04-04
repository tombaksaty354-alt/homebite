import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "@/app/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { KeranjangProvider } from "@/context/KeranjangContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { NotificationProvider } from "@/context/NotificationContext";
import Layout from "@/components/Layout";

export const metadata: Metadata = {
  title: "Homebite - Marketplace Makanan Rumahan UMKM",
  description: "Platform marketplace khusus makanan rumahan yang menghubungkan UMKM dengan konsumen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <KeranjangProvider>
            <WishlistProvider>
              <NotificationProvider>
                <Layout>{children}</Layout>
              </NotificationProvider>
            </WishlistProvider>
          </KeranjangProvider>
        </AuthProvider>
        <script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
          async
        />
      </body>
    </html>
  );
}
