type WebOrderRedirectConfig = {
  webOrderRedirectMessage?: string | null;
  businessWebsite?: string | null;
};

const DEFAULT_MESSAGE =
  "¡Hola! Para que tu pedido quede registrado correctamente y podamos prepararlo más rápido, hacelo desde nuestra carta digital:";

function getDigitalMenuUrl(businessWebsite?: string | null): string | null {
  const baseUrl = process.env.AUTH_URL?.trim() || businessWebsite?.trim();
  if (!baseUrl) return null;

  try {
    return new URL("/carta-digital", baseUrl).toString();
  } catch {
    return null;
  }
}

/**
 * Returns the owner-configured redirect message or a safe default with the
 * public digital-menu URL when the deployment URL is configured.
 */
export function buildWebOrderRedirectMessage(
  config: WebOrderRedirectConfig
): string {
  const customMessage = config.webOrderRedirectMessage?.trim();
  if (customMessage) return customMessage;

  const menuUrl = getDigitalMenuUrl(config.businessWebsite);
  return menuUrl
    ? `${DEFAULT_MESSAGE}\n${menuUrl}`
    : `${DEFAULT_MESSAGE}\nIngresá desde nuestra web para continuar.`;
}
