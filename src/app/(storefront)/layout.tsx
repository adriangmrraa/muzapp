import { StorefrontMotion } from "@/components/storefront/motion-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFAB } from "@/components/layout/whatsapp-fab";
import { UTMCaptureScript } from "@/components/attribution/utm-capture-script";
import { CartProvider } from "@/lib/cart/cart-context";
import { ScrollProgress } from "@/components/motion/scroll-progress";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StorefrontMotion><CartProvider>
      <ScrollProgress />
      <Navbar />
      <UTMCaptureScript />
      <main className="flex-1 overflow-x-hidden">{children}</main>
      <Footer />
      <WhatsAppFAB />
    </CartProvider></StorefrontMotion>
  );
}
