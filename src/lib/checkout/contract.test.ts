import assert from "node:assert/strict";
import test from "node:test";
import { checkoutPhone, extractWebOrderReference, priceCheckout } from "./contract";

const products = [
  { id: 1, name: "Genesis", price: "7500.00", category: "hamburguesa", available: true, comingSoon: false, stock: 4 },
  { id: 2, name: "Pan brioche", price: "900.00", category: "pan_mayorista", available: true, comingSoon: false, stock: null },
];

test("normalizes a local Argentine WhatsApp number", () => {
  assert.equal(checkoutPhone("370 412-3456"), "5493704123456");
  assert.equal(checkoutPhone("+54 370 4123456"), "5493704123456");
});

test("extracts the opaque web reference from the prefilled message", () => {
  assert.equal(
    extractWebOrderReference("Pedido listo. Referencia WEB:550e8400-e29b-41d4-a716-446655440000"),
    "550e8400-e29b-41d4-a716-446655440000",
  );
});

test("prices products from the trusted catalog and detects order type", () => {
  const result = priceCheckout([{ type: "product", id: 2, quantity: 3 }], products, []);
  assert.equal(result.orderType, "pan_mayorista");
  assert.deepEqual(result.items, [{ name: "Pan brioche", quantity: 3, price: 900, unitPrice: 900 }]);
});

test("expands promotion demand and rejects insufficient stock", () => {
  assert.throws(
    () => priceCheckout(
      [{ type: "promo", id: 8, quantity: 3 }],
      products,
      [{ id: 8, name: "Promo doble", customPrice: "18000", active: true, items: [{ productId: 1, quantity: 2 }] }],
    ),
    /no tiene disponibilidad/,
  );
});

test("prices a promotion without component items like the storefront allows", () => {
  const result = priceCheckout(
    [{ type: "promo", id: 8, quantity: 2 }],
    products,
    [{ id: 8, name: "Promo noche", customPrice: "15000", active: true, items: null }],
  );
  assert.deepEqual(result.items, [{ name: "Promo noche", quantity: 2, price: 15000, unitPrice: 15000 }]);
});

test("rejects promotions that are inactive or unknown", () => {
  assert.throws(
    () => priceCheckout(
      [{ type: "promo", id: 9, quantity: 1 }],
      products,
      [{ id: 9, name: "Promo vieja", customPrice: "15000", active: false, items: null }],
    ),
    /ya no está disponible/,
  );
});

test("rejects repeated lines so quantities cannot bypass validation", () => {
  assert.throws(
    () => priceCheckout([
      { type: "product", id: 1, quantity: 1 },
      { type: "product", id: 1, quantity: 1 },
    ], products, []),
    /repetidos/,
  );
});
