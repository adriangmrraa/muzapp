import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFAB } from "@/components/layout/whatsapp-fab";
import { UTMCaptureScript } from "@/components/attribution/utm-capture-script";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <UTMCaptureScript />
      <main className="flex-1 overflow-x-hidden">{children}</main>
      <Footer />
      <WhatsAppFAB />
    </>
  );
}
