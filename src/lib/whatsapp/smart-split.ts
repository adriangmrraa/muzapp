// Smart Split — Divide respuestas largas en burbujas de WhatsApp
// Adaptado de ClinicForge response_sender.py

const MAX_MESSAGE_LENGTH = 400;

export function splitIntoBubbles(text: string, maxLength: number = MAX_MESSAGE_LENGTH): string[] {
  if (!text || text.length <= maxLength) {
    return text ? [text] : [];
  }

  const bubbles: string[] = [];
  
  // 1. Separar por párrafos (doble salto de línea)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  
  for (const p of paragraphs) {
    if (p.length <= maxLength) {
      bubbles.push(p.trim());
    } else {
      // 2. Cortar por puntuación, respetando maxLength
      const sentences = p.split(/(?<=[.!?])\s+/);
      let current = "";
      
      for (const sentence of sentences) {
        if ((current + " " + sentence).trim().length <= maxLength) {
          current = (current + " " + sentence).trim();
        } else {
          if (current) bubbles.push(current);
          current = sentence;
        }
      }
      if (current) bubbles.push(current);
    }
  }

  // Limpiar marcadores internos
  return bubbles.map(b => 
    b.replace(/\[INTERNAL_[A-Z_]+:[^\]]*\]/g, "").trim()
  ).filter(b => b.length > 0);
}

// Detectar si el mensaje necesita smart split
export function needsSmartSplit(text: string): boolean {
  return text.length > MAX_MESSAGE_LENGTH;
}

// Formatear para WhatsApp — agregar indicador de "continúa..."
export function formatAsWhatsAppBubbles(text: string): string[] {
  const bubbles = splitIntoBubbles(text);
  
  if (bubbles.length === 0) return [];
  
  // Si hay más de una burbuja, agregar indicador enlas intermedias
  return bubbles.map((b, i) => {
    if (i < bubbles.length - 1 && b.length > 50) {
      return b + " 👇";
    }
    return b;
  });
}