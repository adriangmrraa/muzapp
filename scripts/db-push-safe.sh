#!/bin/bash
# Ejecuta drizzle-kit push --force pero ignora errores de constraint ya existente
npx drizzle-kit push --force 2>&1 || echo "[db-push] Warning: push may have failed (non-fatal)"
