import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  price: z.coerce
    .number()
    .positive("El precio debe ser mayor a 0")
    .optional(),
  category: z.enum(["hamburguesa", "acompanamiento", "pan_mayorista"]),
  line: z.enum(["pollo", "carne", "clasica", "pan"]),
  imageUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  available: z.boolean().default(true),
  comingSoon: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
});

export type ProductFormData = z.infer<typeof productSchema>;
