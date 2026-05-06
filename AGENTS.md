<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:inter-agent-engram -->
# Inter-Agent Communication via Engram

Cuando hay múltiples agentes trabajando en paralelo en este proyecto:
1. Cargá la skill `inter-agent-engram`
2. Leé las specs compartidas en Engram: `sdd/muzzarella-core/specs`
3. Buscá señales de otros agentes: `mem_search query="SIGNAL" scope=project`
4. Escribí señales al coordinar: `task-claim`, `task-done`, `signal`
5. Respetá la división de tareas definida en specs

**Proyecto**: muzapp
**Specs activas**: `sdd/muzzarella-core/specs`
<!-- END:inter-agent-engram -->
