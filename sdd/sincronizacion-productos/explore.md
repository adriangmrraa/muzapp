# Explore: Sincronizacion de Productos entre DB y Prompts

## Productos Reales en DB (Neon Produccion)
25 productos en 5 categorias:

### Hamburguesas (carne) - 6 productos
Genesis $4.000, Deli Deli $5.000, Mamita $6.000, Bookbinder $7.000, Toro Asado $8.000, Book Simple $5.500

### Acompanamientos - 3 productos
Papas Fritas $4.000 (available=false), Papas Chesse $6.000, Papas Completas $7.000

### Pan Mayorista - 10 productos
Prepizza $800, Prepizza x 12 u $9.600
Pan Hamburguesa x 4 u Sesamo $1.600, x 12 u Sesamo $4.400
Pan Hamburguesa x 4 u Parmesano $1.600, x 12 u Parmesano $4.600
Pan Lomito x 4 u Sesamo $1.600, x 12 u Sesamo $4.600
Pan Lomito x 4 u Parmesano $1.800, x 12 u Parmesano $5.000

### Tragos VIP - 5 productos (con variantes Sin Crema/Con Crema +$500)
Frutilla, Durazno, Anana, Frutos Rojos, Mixtos - todos $6.500

### Bebidas - 1 producto
Coca-Cola $1.500

## Estado Actual de los Prompts

### Telegram (system-prompt.ts)
- No tiene productos hardcodeados SOLO ejemplos
- El MAPEO SEMANTICO actual solo cubre: Genesis, Deli Deli, Mamita, Bookbinder, Toro Asado, Book Simple, Papas, Coca-Cola, Prepizza
- FALTAN: Book Simple, Papas Chesse, Papas Completas, Tragos VIP, todos los panes con sus variantes (4u/12u, Sesamo/Parmesano)

### WhatsApp (prompt-builder.ts)
- DEFAULT_SYSTEM_PROMPT solo menciona categorias generales
- Menu dinamico via getMenuData() - correcto, siempre actualizado
- resolveItems() mapea nombres en createOrder - funciona bien

## Hallazgos Clave
1. Telegram prompt necesita MAPEO SEMANTICO completo de los 25 productos
2. Las variantes de pan (4u vs 12u, Sesamo vs Parmesano) necesitan estar en el mapeo
3. Los Tragos VIP con variantes (Con/Sin Crema) necesitan estar en el mapeo
4. Papas Fritas esta como no disponible en DB - no deberia sugerirse
5. resolveItems() en order-utils.ts ya hace matching fuzzy - pero el bot de Telegram no usa resolveItems, usa createOrder que SI lo usa internamente
