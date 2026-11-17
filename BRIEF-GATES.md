# BRIEF — muzapp: correr gates reales sobre `10dd668` (broadcast preview + dup-send guard)

## Contexto (medido por el guardian, no auto-reporte)
- Worktree (aislado de Orca, NO es el checkout compartido): `C:/Users/Asus/orca/workspaces/muzapp/devin`
- Rama: `devin` · HEAD esperado: `10dd668` `merge(telegram): integrate broadcast preview, inbound 24h window and dup-send guard`
- El commit ya está respaldado en GitHub: rama `backup/devin-telegram-broadcast` = `10dd668c6a73ba2c771762144a2ad9b2f6fd9229` (remote `origin` = `https://github.com/adriangmrraa/muzapp.git`).
- Checkout compartido PROHIBIDO: `C:/Users/Asus/Documents/estabilizacion/Mrs Muzzarella/muzapp` — no lo toques.
- OJO: este repo maneja tokens de Telegram/WhatsApp. CERO secretos en logs, commits, reporte ni artefactos. No imprimas `.env`, ni variables con `TOKEN`/`SECRET`/`KEY`.

## Objetivo (trabajo de VERIFICACIÓN, sin escribir código)
1. Correr los **gates reales** del repo sobre `10dd668`, sin modificar código:
   - Leer `package.json` → `scripts` para identificar los comandos reales del repo (no inventar comandos).
   - Correr los que apliquen: typecheck, suite de tests, build, lint (si existen).
   - Reportar **exit code + línea de resumen** de CADA gate (pegado de la salida real, no paráfrasis).
   - Si un gate no es ejecutable (deps ausentes, falta config, falta env), reportarlo explícitamente como **NO EJECUTABLE** y por qué. NUNCA inventar verde.
   - Si `node_modules` falta o está incompleto, instalá deps (`npm ci` o el package manager del repo) — eso NO es modificar código.
2. **Deuda preexistente**: medir y reportar el baseline (tests fallando antes del commit si es fácil de aislar). NO tocar tests para que den verde.
3. **Verificar la parte funcional del commit**: el test nuevo `src/lib/whatsapp/broadcast.test.ts` debe **realmente correr** y cubrir (a) el guard de dup-send y (b) la ventana inbound de 24h. Confirmar con el nombre del test/caso que lo cubre, quoting del output real.
4. Handoff con evidencia real: SHA, exit codes, `git log --oneline -5`, `git diff --check` (exit code), `git merge-base --is-ancestor` + AHEAD/BEHIND vs `origin/main`, y el **comando exacto** para abrir el PR de `backup/devin-telegram-broadcast` contra `main` (solo el comando, NO lo ejecutes).

## Límites duros
- **NO** merge a `main`, **NO** push a `main`/`master`, **NO** deploy, **NO** migraciones, **NO** abrir PR.
- **NO** modificar código ni tests: esta unidad es SOLO gates + reporte. Si un gate falla de verdad → reportar el fallo exacto y dejar la corrección para un slice aparte (no maquillar verde).
- NUNCA `git add -A`, `git add .`, `git stash`, `git commit`, `git checkout` salvo autorización explícita en este brief (no la hay).
- NUNCA tocar el checkout compartido.
- No dejar procesos colgados: si levantás un dev server para los tests, bajalo al terminar.

## Handoff (formato de salida, en español rioplatense)
1. worktree · rama · SHA
2. exit code + línea de resumen por gate
3. verificación funcional del test nuevo (nombre del caso + output)
4. `git log --oneline -5` · `git diff --check` · `merge-base --is-ancestor` + AHEAD/BEHIND
5. comando exacto pendiente de firma para el PR
6. qué queda pendiente
