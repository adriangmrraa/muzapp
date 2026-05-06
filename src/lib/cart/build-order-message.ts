export function buildOrderMessage(
  items: { name: string; quantity: number; price: number }[],
): string {
  let message = "Hola! Quiero hacer un pedido:\n\n"
  let total = 0

  for (const item of items) {
    const subtotal = item.quantity * item.price
    total += subtotal
    message += `• ${item.quantity}x ${item.name} — $${subtotal.toLocaleString("es-AR")}\n`
  }

  message += `\n💰 Total: $${total.toLocaleString("es-AR")}\n\n`
  message += "📍 Zona: Formosa"

  return message
}
