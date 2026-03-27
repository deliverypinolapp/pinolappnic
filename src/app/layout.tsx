import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { Toaster } from "react-hot-toast";
import { appUrl } from "@/lib/supabase/config";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "PinolApp Nicaragua | Delivery de comida, farmacias y mercados",
  description:
    "Plataforma de delivery nicaragüense para pedir comida, farmacia y supermercado con seguimiento en tiempo real.",
  keywords: [
    "delivery Nicaragua",
    "comida a domicilio Managua",
    "farmacia a domicilio",
    "mercado a domicilio",
    "PinolApp",
  ],
  openGraph: {
    title: "PinolApp Nicaragua",
    description:
      "Pide comida, farmacia y mercado desde una sola app con experiencia lista para producción.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1f2937",
              color: "#fff",
              borderRadius: "16px",
              padding: "12px 16px",
              fontSize: "14px",
              fontWeight: "500",
              maxWidth: "380px",
            },
            success: {
              iconTheme: {
                primary: "#16a34a",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#dc2626",
                secondary: "#fff",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
