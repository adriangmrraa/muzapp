"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { encodeRefCode, buildWhatsAppLink } from "@/lib/attribution/ref-code";
import { ClipboardCopyIcon, CheckIcon, LinkIcon } from "lucide-react";

const PHONE_REGEX = /^[0-9]{10,15}$/;

export default function LinkGeneratorPage() {
  const [campaign, setCampaign] = useState("");
  const [adset, setAdset] = useState("");
  const [ad, setAd] = useState("");
  const [phone, setPhone] = useState("5493705115020");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function validatePhone(value: string): boolean {
    if (!PHONE_REGEX.test(value)) {
      setPhoneError(
        "Número inválido. Incluí código de país (ej: 5493704...)"
      );
      return false;
    }
    setPhoneError(null);
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!campaign.trim()) return;
    if (!validatePhone(phone)) return;

    const refCode = encodeRefCode({
      campaignId: campaign.trim(),
      adsetId: adset.trim() || "general",
      adId: ad.trim() || "general",
      timestamp: Date.now(),
    });

    const url = buildWhatsAppLink(phone.trim(), refCode);
    setGeneratedUrl(url);
    setCopied(false);
  }

  async function handleCopy() {
    if (!generatedUrl) return;
    await navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Generador de Links
        </h1>
        <p className="text-sm text-muted-foreground">
          Creá links de WhatsApp con atribución para tus campañas
        </p>
      </div>

      <div className="rounded-xl bg-card border border-border/40 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Campaña */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="campaign">
              Campaña <span className="text-destructive">*</span>
            </Label>
            <Input
              id="campaign"
              placeholder="ej: hamburguesas-junio"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              required
            />
          </div>

          {/* Adset */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="adset">
              Adset{" "}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="adset"
              placeholder="ej: mujeres-25-35-formosa"
              value={adset}
              onChange={(e) => setAdset(e.target.value)}
            />
          </div>

          {/* Ad */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ad">
              Ad{" "}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="ad"
              placeholder="ej: video-pollo-oferta"
              value={ad}
              onChange={(e) => setAd(e.target.value)}
            />
          </div>

          {/* Teléfono */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">
              Teléfono <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              placeholder="5493705115020"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (phoneError) validatePhone(e.target.value);
              }}
              onBlur={(e) => validatePhone(e.target.value)}
            />
            {phoneError && (
              <p className="text-xs text-destructive">{phoneError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Incluí código de país sin el + (ej: 5493705115020)
            </p>
          </div>

          <button
            type="submit"
            disabled={!campaign.trim()}
            className="flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          >
            <LinkIcon className="size-4" />
            Generar Link
          </button>
        </form>
      </div>

      {/* Result */}
      {generatedUrl && (
        <div className="rounded-xl bg-card border border-border/40 shadow-sm p-6 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-foreground">
            Link generado
          </h2>

          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg bg-muted px-3 py-2 text-xs text-foreground break-all font-mono">
              {generatedUrl}
            </div>
            <button
              onClick={handleCopy}
              className="shrink-0 flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border text-sm font-medium text-foreground transition-colors hover:bg-muted"
              title="Copiar al portapapeles"
            >
              {copied ? (
                <>
                  <CheckIcon className="size-4 text-green-400" />
                  <span className="text-green-400">¡Copiado!</span>
                </>
              ) : (
                <>
                  <ClipboardCopyIcon className="size-4" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>

          {/* Attribution preview */}
          <div className="rounded-lg bg-muted/50 border border-border/40 px-4 py-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Atribución: </span>
            Campaña: <span className="text-foreground">{campaign}</span>
            {adset && (
              <>
                {" "}
                | Adset: <span className="text-foreground">{adset}</span>
              </>
            )}
            {ad && (
              <>
                {" "}
                | Ad: <span className="text-foreground">{ad}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
