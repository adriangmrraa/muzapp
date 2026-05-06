import { db } from "@/db";
import { products } from "@/db/schema";
import { asc } from "drizzle-orm";
import ProductsTable from "./products-table";

export const metadata = {
  title: "Productos — Mrs Muzzarella Admin",
};

export default async function ProductsPage() {
  const allProducts = await db
    .select()
    .from(products)
    .orderBy(asc(products.sortOrder), asc(products.name));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gold-gradient">
          Productos
        </h1>
        <p className="text-sm text-muted-foreground">
          Administrá el catálogo — precios, disponibilidad y orden de menú
        </p>
      </div>
      <ProductsTable initialProducts={allProducts} />
    </div>
  );
}
