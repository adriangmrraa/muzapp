"use client"

import { useCart } from "@/lib/cart/cart-context"
import { buildOrderMessage } from "@/lib/cart/build-order-message"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
} from "lucide-react"

const WHATSAPP_NUMBER = "5493704123456"

type CartDrawerProps = {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, total, itemCount, updateQuantity, removeItem, clearCart } =
    useCart()

  function handleWhatsApp() {
    const message = buildOrderMessage(
      items.map((i) => ({
        name: i.product.name,
        quantity: i.quantity,
        price: i.product.price,
      })),
    )
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
    window.open(url, "_blank")
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader className="flex-row items-center justify-between gap-0">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="size-5" />
            Tu Pedido
            {itemCount > 0 && (
              <span className="text-muted-foreground text-sm font-normal">
                ({itemCount} {itemCount === 1 ? "item" : "items"})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
            <ShoppingCart className="text-muted-foreground size-12 opacity-30" />
            <p className="text-muted-foreground text-sm">
              No hay productos en el carrito
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-1 overflow-y-auto py-4">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                >
                  <span className="text-2xl">{item.product.emoji}</span>

                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">
                      {item.product.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      ${item.product.price.toLocaleString("es-AR")} c/u
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity - 1)
                      }
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-6 text-center text-sm tabular-nums">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity + 1)
                      }
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>

                  <p className="w-16 text-right text-sm font-medium tabular-nums">
                    ${(item.product.price * item.quantity).toLocaleString("es-AR")}
                  </p>

                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeItem(item.product.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="size-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-2">
              <Separator />

              <div className="space-y-1 px-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${total.toLocaleString("es-AR")}</span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>${total.toLocaleString("es-AR")}</span>
                </div>
              </div>

              <Button
                variant="premium"
                className="w-full gap-2 py-5 text-base"
                onClick={handleWhatsApp}
              >
                Enviar pedido por WhatsApp
                <ArrowRight className="size-4" />
              </Button>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2 transition-colors"
                >
                  Vaciar carrito
                </button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
