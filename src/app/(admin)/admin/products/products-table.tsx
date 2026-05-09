"use client";

import { useState, useTransition, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { fadeUpSmall } from "@/lib/animation-variants";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import {
  deleteProduct,
  toggleProductAvailability,
  createProduct,
  updateProduct,
} from "./actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string | null;
  imageUrl: string | null;
  category: "hamburguesa" | "acompanamiento" | "pan_mayorista";
  line: "pollo" | "carne" | "clasica" | "pan";
  available: boolean;
  comingSoon: boolean;
  sortOrder: number;
};

interface ProductsTableProps {
  initialProducts: Product[];
}

type ActionState = { error?: string; success?: boolean } | null;

// ─── Display maps ─────────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<Product["category"], string> = {
  hamburguesa: "Hamburguesa",
  acompanamiento: "Acompañamiento",
  pan_mayorista: "Pan Mayorista",
};

const LINE_LABEL: Record<Product["line"], string> = {
  pollo: "Pollo",
  carne: "Carne",
  clasica: "Clásica",
  pan: "Pan",
};

const CATEGORY_VARIANT: Record<
  Product["category"],
  "default" | "secondary" | "outline"
> = {
  hamburguesa: "default",
  acompanamiento: "secondary",
  pan_mayorista: "outline",
};

const LINE_VARIANT: Record<
  Product["line"],
  "default" | "secondary" | "outline"
> = {
  pollo: "outline",
  carne: "secondary",
  clasica: "default",
  pan: "outline",
};

// ─── Product Form ─────────────────────────────────────────────────────────────

interface ProductFormProps {
  product: Product | null;
  onClose: () => void;
}

function ProductForm({ product, onClose }: ProductFormProps) {
  const router = useRouter();
  const isEdit = product !== null;

  const [available, setAvailable] = useState(product?.available ?? true);
  const [comingSoon, setComingSoon] = useState(product?.comingSoon ?? false);
  const [imageUrlValue, setImageUrlValue] = useState(product?.imageUrl ?? "");
  const [imagePreview, setImagePreview] = useState(product?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/media/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al subir");
      }

      const data = await res.json();
      setImageUrlValue(data.url);
      toast.success("Imagen subida");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir imagen");
      setImagePreview(product?.imageUrl ?? ""); // revert preview
    } finally {
      setUploading(false);
      // Cleanup object URL after a delay
      setTimeout(() => URL.revokeObjectURL(localPreview), 5000);
    }
  }

  async function formAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
    formData.set("available", String(available));
    formData.set("comingSoon", String(comingSoon));

    if (isEdit) {
      return updateProduct(product.id, formData);
    }
    return createProduct(formData);
  }

  const [state, dispatch, isPending] = useActionState(formAction, null);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success(isEdit ? "Producto actualizado" : "Producto creado");
      router.refresh();
      onClose();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  return (
    <form action={dispatch} className="flex flex-col gap-5 py-4">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nombre *</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={product?.name ?? ""}
          placeholder="Ej: Hamburguesa Clásica"
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={product?.description ?? ""}
          placeholder="Descripción opcional del producto"
        />
      </div>

      {/* Price */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="price">Precio *</Label>
        <Input
          id="price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={product?.price ?? ""}
          placeholder="0.00"
        />
      </div>

      {/* Image upload */}
      <div className="flex flex-col gap-1.5">
        <Label>Imagen del producto</Label>
        <input type="hidden" name="imageUrl" value={imageUrlValue} />
        <div className="flex items-start gap-4">
          {/* Preview */}
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl text-white/20">📸</span>
            )}
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => document.getElementById(`image-picker-${product?.id || "new"}`)?.click()}
              >
                {uploading ? "Subiendo..." : "Subir foto"}
              </Button>
              {imageUrlValue && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setImageUrlValue(""); setImagePreview(""); }}
                  className="text-red-400 hover:text-red-300"
                >
                  Quitar
                </Button>
              )}
            </div>
            <input
              id={`image-picker-${product?.id || "new"}`}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleImageSelect}
            />
            {imageUrlValue && (
              <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                {imageUrlValue}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category">Categoría *</Label>
        <select
          id="category"
          name="category"
          required
          defaultValue={product?.category ?? "hamburguesa"}
          className={selectClass}
        >
          <option value="hamburguesa">Hamburguesa</option>
          <option value="acompanamiento">Acompañamiento</option>
          <option value="pan_mayorista">Pan Mayorista</option>
        </select>
      </div>

      {/* Line */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="line">Línea *</Label>
        <select
          id="line"
          name="line"
          required
          defaultValue={product?.line ?? "clasica"}
          className={selectClass}
        >
          <option value="pollo">Pollo</option>
          <option value="carne">Carne</option>
          <option value="clasica">Clásica</option>
          <option value="pan">Pan</option>
        </select>
      </div>

      {/* Sort Order */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sortOrder">Orden</Label>
        <Input
          id="sortOrder"
          name="sortOrder"
          type="number"
          min="0"
          defaultValue={product?.sortOrder ?? 0}
        />
      </div>

      {/* Available switch */}
      <div className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-white/[0.02]">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="available" className="cursor-pointer">Disponible</Label>
          <span className="text-xs text-muted-foreground">
            El producto aparece como disponible para la venta
          </span>
        </div>
        <Switch
          id="available"
          checked={available}
          onCheckedChange={setAvailable}
        />
      </div>

      {/* Coming soon switch */}
      <div className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-white/[0.02]">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="comingSoon" className="cursor-pointer">Próximamente</Label>
          <span className="text-xs text-muted-foreground">
            Muestra el producto como "próximamente disponible"
          </span>
        </div>
        <Switch
          id="comingSoon"
          checked={comingSoon}
          onCheckedChange={setComingSoon}
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isPending}
        className="btn-gold mt-2 transition-opacity hover:opacity-90"
      >
        {isPending
          ? isEdit
            ? "Guardando..."
            : "Creando..."
          : isEdit
            ? "Guardar cambios"
            : "Crear producto"}
      </Button>
    </form>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductsTable({ initialProducts }: ProductsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [availability, setAvailability] = useState<Record<number, boolean>>(
    () =>
      Object.fromEntries(initialProducts.map((p) => [p.id, p.available]))
  );

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [lineFilter, setLineFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);

  const isSheetOpen = isNewProductOpen || selectedProduct !== null;
  const sheetProduct = isNewProductOpen ? null : selectedProduct;

  function handleCloseSheet() {
    setIsNewProductOpen(false);
    setSelectedProduct(null);
  }

  // ─── Filtered products ──────────────────────────────────────────────────────

  const filtered = initialProducts.filter((p) => {
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (lineFilter !== "all" && p.line !== lineFilter) return false;
    return true;
  });

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function handleToggleAvailability(id: number, next: boolean) {
    setAvailability((prev) => ({ ...prev, [id]: next }));

    startTransition(async () => {
      const result = await toggleProductAvailability(id, next);
      if ("error" in result && result.error) {
        setAvailability((prev) => ({ ...prev, [id]: !next }));
        toast.error("Error al actualizar disponibilidad");
      } else {
        toast.success(
          next ? "Producto marcado como disponible" : "Producto marcado como no disponible"
        );
        router.refresh();
      }
    });
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);

    startTransition(async () => {
      const result = await deleteProduct(id);
      if ("error" in result && result.error) {
        toast.error("Error al eliminar el producto");
      } else {
        toast.success("Producto eliminado");
        router.refresh();
      }
    });
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar: filters + new product button */}
      <motion.div
        variants={fadeUpSmall}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex gap-2">
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-[180px]"
          >
            <option value="all">Todas las categorías</option>
            <option value="hamburguesa">Hamburguesa</option>
            <option value="acompanamiento">Acompañamiento</option>
            <option value="pan_mayorista">Pan Mayorista</option>
          </Select>

          <Select
            value={lineFilter}
            onChange={(e) => setLineFilter(e.target.value)}
            className="w-[160px]"
          >
            <option value="all">Todas las líneas</option>
            <option value="pollo">Pollo</option>
            <option value="carne">Carne</option>
            <option value="clasica">Clásica</option>
            <option value="pan">Pan</option>
          </Select>
        </div>

        <motion.div whileHover={{ y: -1 }} transition={{ duration: 0.15 }}>
          <Button onClick={() => setIsNewProductOpen(true)}>
            + Nuevo Producto
          </Button>
        </motion.div>
      </motion.div>

      {/* Table */}
      <motion.div
        variants={fadeUpSmall}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.08 }}
        className="rounded-md border"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Línea</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead className="text-center">Disponible</TableHead>
              <TableHead className="text-center">Próximamente</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No hay productos que coincidan con los filtros.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((product) => (
                <TableRow
                  key={product.id}
                  className="transition-colors hover:bg-white/[0.02]"
                >
                  {/* Name */}
                  <TableCell className="font-medium">{product.name}</TableCell>

                  {/* Category badge */}
                  <TableCell>
                    <Badge variant={CATEGORY_VARIANT[product.category]}>
                      {CATEGORY_LABEL[product.category]}
                    </Badge>
                  </TableCell>

                  {/* Line badge */}
                  <TableCell>
                    <Badge variant={LINE_VARIANT[product.line]}>
                      {LINE_LABEL[product.line]}
                    </Badge>
                  </TableCell>

                  {/* Price */}
                  <TableCell>
                    {product.price != null
                      ? `$ ${Number(product.price).toLocaleString("es-AR")}`
                      : "—"}
                  </TableCell>

                  {/* Available switch */}
                  <TableCell className="text-center">
                    <Switch
                      checked={availability[product.id] ?? product.available}
                      disabled={isPending}
                      onCheckedChange={(checked) =>
                        handleToggleAvailability(product.id, checked)
                      }
                      aria-label={`Disponibilidad de ${product.name}`}
                    />
                  </TableCell>

                  {/* Coming soon switch (read-only — editing via Sheet) */}
                  <TableCell className="text-center">
                    <Switch
                      checked={product.comingSoon}
                      disabled
                      aria-label={`Próximamente ${product.name}`}
                    />
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="transition-colors hover:border-[#D4A017]/40 hover:text-[#D4A017]"
                        onClick={() => setSelectedProduct(product)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="transition-opacity hover:opacity-90"
                        onClick={() => setDeleteTarget(product)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>

      {/* Create / Edit Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={(open) => { if (!open) handleCloseSheet(); }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader className="border-b border-[#D4A017]/20 pb-4">
            <SheetTitle className="text-gold-gradient">
              {isNewProductOpen ? "Nuevo Producto" : "Editar Producto"}
            </SheetTitle>
            <SheetDescription>
              {isNewProductOpen
                ? "Completá los datos para agregar un nuevo producto al menú."
                : `Modificá los datos de "${selectedProduct?.name}".`}
            </SheetDescription>
          </SheetHeader>

          <ProductForm
            key={isNewProductOpen ? "new" : String(selectedProduct?.id)}
            product={sheetProduct}
            onClose={handleCloseSheet}
          />
        </SheetContent>
      </Sheet>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar{" "}
              <span className="font-semibold">{deleteTarget?.name}</span>. Esta
              acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
