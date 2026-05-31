# Design Fase F: Verificación Final

## Estrategia

Barrer el código con grep para encontrar cualquier entry point que NO tenga normalizePhone y que escriba/lea teléfonos en la DB.

## Comandos de Verificación

```bash
# Todos los inserts a leads
rg "leads\.insert" src/ --context 3

# Todos los updates a leads con phone
rg "leads\.phone" src/ --context 2

# Todas las búsquedas por leads.phone
rg "eq\(leads\.phone" src/ --context 1

# Todos los inserts a orders con phoneNumber
rg "phoneNumber:" src/ --context 2

# Todos los imports de normalizePhone (para ver qué archivos ya lo tienen)
rg "normalizePhone" src/ --context 1
```

## Criterio de Aceptación

- Cero inserts/updates a `leads.phone` sin `normalizePhone()` en el mismo scope
- Cero archivos que manejen teléfonos y NO tengan import de `normalizePhone`
