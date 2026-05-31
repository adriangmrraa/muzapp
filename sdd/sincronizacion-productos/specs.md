# Specs: Sincronizar Productos DB <> Prompts

## Cambio Unico
Actualizar el MAPEO SEMANTICO en `src/lib/telegram/system-prompt.ts`

## MAPEO SEMANTICO NUEVO (reemplazar el actual)

### Hamburguesas (carne)
"Gene" / "Genesis" / "Génesis" -> Genesis ($4.000)
"Deli" / "Deli Deli" / "Doble" -> Deli Deli ($5.000)
"Mami" / "Mamita" / "Mama" -> Mamita ($6.000)
"Book" / "Bookbinder" / "Libro" -> Bookbinder ($7.000)
"Toro" / "Toro Asado" / "Asado" -> Toro Asado ($8.000)
"Book Simple" / "Simple" -> Book Simple ($5.500)

### Acompanamientos
"Papas" / "Fritas" -> Papas Fritas ($4.000, NO disponible)
"Papas con queso" / "Chesse" / "Cheese" / "Papas cheese" -> Papas Chesse ($6.000)
"Completas" / "Papas completas" -> Papas Completas ($7.000)

### Pan Mayorista (especificar siempre 4u/12u y Sesamo/Parmesano)
"Prepizza" / "Pre-pizza" -> Prepizza ($800)
"Prepizza x 12" / "docena de prepizza" -> Prepizza x 12 u ($9.600)
"Pan de hamburguesa sesamo 4" / "pan hamburguesa sesamo 4u" -> Pan de Hamburguesa x 4 u - Sesamo ($1.600)
"Pan de hamburguesa sesamo 12" / "docena pan hamburguesa sesamo" -> Pan de Hamburguesa x 12 u - Sesamo ($4.400)
"Pan de hamburguesa parmesano 4" / "pan hamburguesa parmesano 4u" -> Pan de Hamburguesa x 4 u - Parmesano ($1.600)
"Pan de hamburguesa parmesano 12" / "docena pan hamburguesa parmesano" -> Pan de Hamburguesa x 12 u - Parmesano ($4.600)
"Pan de lomito sesamo 4" / "pan lomito sesamo 4u" -> Pan de Lomito x 4 u - Sesamo ($1.600)
"Pan de lomito sesamo 12" / "docena pan lomito sesamo" -> Pan de Lomito x 12 u - Sesamo ($4.600)
"Pan de lomito parmesano 4" / "pan lomito parmesano 4u" -> Pan de Lomito x 4 u - Parmesano ($1.800)
"Pan de lomito parmesano 12" / "docena pan lomito parmesano" -> Pan de Lomito x 12 u - Parmesano ($5.000)

### Tragos VIP (preguntar si quieren Con Crema o Sin Crema)
"Tragos" / "VIP" / "Tragos VIP" / "Tragos V.I.P" -> Tragos V.I.P ($6.500, consultar sabor y si es con crema o sin crema)
"Frutilla" / "VIP Frutilla" -> Tragos V.I.P Frutilla
"Durazno" / "VIP Durazno" -> Tragos V.I.P Durazno
"Anana" / "VIP Anana" -> Tragos V.I.P Anana
"Frutos Rojos" / "VIP Frutos Rojos" -> Tragos V.I.P Frutos Rojos
"Mixtos" / "VIP Mixtos" -> Tragos V.I.P Mixtos

### Bebidas
"Coca" / "Coca Cola" / "Coca-Cola" / "Cola" -> Coca-Cola ($1.500)

## Nota
SIEMPRE usa createOrder que internamente llama a resolveItems() para mapear automaticamente.
Este mapeo es para que el bot ENTIENDA lo que dice el admin, no para reemplazar a resolveItems.
