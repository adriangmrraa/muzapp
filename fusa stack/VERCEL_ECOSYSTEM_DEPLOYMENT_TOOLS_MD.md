# 🚀 FUSA LABS: Stack de Desarrollo Estratégico para MVPs Rápidos

## 🌟 Descripción General e Identidad Institucional

Este documento detalla el **stack de desarrollo estandarizado** diseñado exclusivamente por **FUSA LABS** —_Agencia de Desarrollo de Software con IA y Consultora integral_— para construir y escalar Productos Mínimos Viables (MVP) a alta velocidad dentro del ecosistema de Vercel e integrando agentes autónomos avanzados.

Dada la capacidad estructural para resolver operativamente **todos los perfiles del ciclo de vida del desarrollo de software**, el modelo ha sido optimizado con un claro enfoque en el **trabajo colaborativo y la sinergia en equipo**. Al emplear tecnologías unificadas, se garantiza que los desarrolladores y agentes de IA colaboren armónicamente sin la menor fricción técnica o administrativa.

El mandato estratégico instruye iniciar y **desarrollar la totalidad del MVP a costo cero**, capitalizando los planes gratuitos (Free Tiers) de las plataformas involucradas. La implementación de infraestructura escalable de pago, dominios organizacionales o despliegues puros en VPS, procederá única y exclusivamente tras la aceptación formal del cliente y liquidación inicial del ciclo contractual.

Al implementar esta arquitectura corporativa, se habilita la iteración continua desde la ideación inicial hasta un entorno desplegado y validado, acortando tiempos operativos de forma significativa frente a los estándares de la industria.

Diagrama general de interacciones colaborativas de la Agencia:

```mermaid
flowchart TD
    A[Navegador del Usuario] -->|Interactúa con| B(Next.js App)
    B -->|UI Modularizada| C[shadcn/ui Componentes Prefabricados]
    B -->|Consulta datos vía| D{Drizzle ORM}
    D -->|Se conecta a| E[(Neon Database - Free Tier)]
    B -->|Funciones de IA | F[Vercel AI SDK]
    B -->|Desarrollo orquestado por| O(((Opencode CLI)))
    O -->|Memoria y Contexto| M[(Engram MCP)]
    O -->|Búsqueda y Docs| S[Exa / Context7 MCP]
    O -->|Documentación Oficial| N[(Notion MCP)]
```

---

## 🏗️ Arquitectura Visual y Prevención de "Vibecoding"

Para garantizar la estabilidad a largo plazo y la reputación de calidad de la agencia, se prohíbe el vibecoding.

Las vistas frontales están sujetas a una **modularización obligatoria**. Al distribuir el diagrama UX en componentes funcionales modularizados, diversos miembros (ingenieros, perfiles IA) manipularán el producto simultáneamente eludiendo dependencias fatales. Toda vista MVP debe segmentarse por convención en bloques "Lego", por ejemplo:

- `Navbar` (Navegación superior persistente)
- `Sidebar` (Estructura de menús laterales)
- `Main` (Marco contenido central dinámico)
- `Footer` (Pie y sitemaps anexos)

Esta segregación, provista inicialmente por Shadcn, confiere a la base del cliente una edición controlada o migración de piezas individuales garantizando tolerancia máxima al fallo.

### Creación y Edición de UI con Tweakcn

👉 **Herramienta complementaria:** [Tweakcn](https://tweakcn.com/)

Para sostener los estándares de entrega de alta velocidad, se delega el maquetado visual del ecosistema `shadcn/ui` en **Tweakcn**.

**El valor estandarizado:** Desvincula el diseño visual de la programación lógica. Permite a los desarrolladores estilizar componentes desde el navegador y exportar directamente los temas (`.css` o JSON) a GitHub, logrando que la interfaz avance en paralelo sin bloquear el desarrollo TypeScript.

---

## 💻 Entorno de Desarrollo Principal: Opencode CLI

👉 **Link oficial:** [Opencode](https://opencode.ai/)

Para unificar la ejecución técnica, el desarrollo de todos los proyectos de los clientes recae centralmente en **Opencode CLI**.

Esta estandarización garantiza que la red de **trabajo remoto corporativo** carezca de fisuras operativas. Las ausencias o rotaciones posibilitan que todo dev o trabajador de infraestructura de soporte acceda mediante **[Opencode Web](https://opencode.ai/docs/web/)** ejecutando rutinas integrales en la nube idénticas a las configuraciones locales sin periodos muertos o rampas extendidas de acoplamiento.

### Servidores MCP Obligatorios (Model Context Protocol)

El marco de la consultora dispone los siguientes MCP en línea forzosa para conectar bases cognitivas con la maquinaria IA de Opencode:

- **Exa MCP:** Rastreo semántico profundo en Internet.
  _💡 Sugerencia MVP en agencia:_ Reconocimiento de software competidor del cliente desde la iniciación del proyecto, a fin de estructurar las ventajas competitivas técnicas.
- **Context7 MCP:** Integridad máxima documental y prevención de "Alucinación de motor LLM".
  _💡 Sugerencia MVP en agencia:_ Interfaz mandataria utilizada previa ordenación a la IA de codificar librerías activas (ej. sub-rutas dinámicas App Router).
- **Engram MCP:** Memoria cognitiva corporativa (Project/Personal Scopes).
  _💡 Sugerencia MVP en agencia:_ Volcado instantáneo de esquemas lógicos y estéticos solicitados específicamente para la verticalidad del mandante del proyecto actual; manteniéndolos en la base persistente independientemente del agente accionante.
- **Notion MCP:** Integrador de planeación remota bidireccional de FUSA LABS.
  _💡 Sugerencia MVP en agencia:_ Sincronización ineludible de métricas operacionales con SOW / PRD formales pactados en la gestión asimilada.
- **Brave Search MCP:** Mapeo de errores y colisiones públicas al instante.

### Skills e Identidad de Desarrollo: Spec-Driven Development (SDD)

El emblema arquitectónico sobre el cual se cimenta el software reside en **Spec-Driven Development (SDD)** dictaminado desde los ecosistemas [Gentle-AI](https://github.com/Gentleman-Programming/gentle-ai).

Los perfiles de desarrollo de agentes IA y humanos están **restringidos procedimentalmente**. Se prohíben por completo los accesos directos no estructurados al estado del código.

Toda alteración operativa se ejecuta rígidamente dentro del marco atómico transversal de la compilación de perfiles SDD:
**[Toolchain Atómica de Agentes (SDD Skills)](https://github.com/Gentleman-Programming/agent-teams-lite/tree/main/skills)**:

1. `sdd-explore` & `sdd-propose`: Ideación técnica compartida con el equipo frente a disyuntivas del MVP.
2. `sdd-spec` & `sdd-design`: Aprobación transversal para formalizar diseños (incorporando el **Estructurado Canónico Operativo [OpenSpec](https://github.com/Gentleman-Programming/gentle-ai/tree/main/openspec)** de traspaso documentativo).
3. `sdd-tasks` & `sdd-apply`: Segmentación de frentes modulares de Interfaz y Lógica, con aislamiento estricto en ramas derivativas del trabajo.
4. `sdd-verify` & `sdd-archive`: Aprobación empírica y sellado asimilando resultados preproductivos. Mínimo costo; máxima cohesión.

---

## 🧩 Componentes del Ecosistema Productivo

### 1. Next.js Boilerplate

👉 **Link oficial:** [Next.js Vercel Templates](https://vercel.com/templates/next.js/nextjs-boilerplate)
Arquitectura universal de entrada que suprime el armado precario al fundar nuevos repositorios MVP.

### 2. shadcn/ui

👉 **Link oficial:** [shadcn/ui](https://ui.shadcn.com/)
Matriz UI modular libre de la rigidez de empaquetados pesados (_npm_ abstractos); proveyendo independencia plena de _Styling_.

### 3. Vercel AI SDK

👉 **Link oficial:** [Vercel AI SDK](https://sdk.vercel.ai/docs/introduction)
Enrutador base frente a interfaces de lenguaje avanzado premitigando interrupciones de Streaming HTTP estándar.

### 4. Neon (PostgreSQL Serverless)

👉 **Link oficial:** [Neon Database](https://neon.tech/docs/introduction)
Operatividad DB "Serverless" que anula "Cold Starts" y minimiza el Costo de Base Inicial requerido por la agencia, empleando _Connection Pooling_.

### 5. Drizzle ORM

👉 **Link oficial:** [Drizzle ORM](https://orm.drizzle.team/docs/overview)
Protección de compilación fuerte estricta. Suprime los riesgos colapsantes generados comúnmente en startups por desvíos con SQL frágiles.

---

## 🛠️ Herramientas Complementarias:

### nextjs-seo-optimizer

Habilidad que sistematiza métricas base orgánicas del cliente operando pasivamente la generación de mapeos (sitemaps y etiquetas indexables).

### vercel/ai-elements

Extensión visual especializada en IA: adjuntos e interactores voceros sin demanda costosa directa por parte del equipo lógico.

---

## ⚙️ Configuración y Gobernanza Central de la Agencia

### Variables Criptográficas

Se restringe estrictamente la contención de claves API, URIs y tokens lógicos fuera del marco `local`:

```env
# Ejemplo base Neon
DATABASE_URL=postgresql://usuario:password@host.neon.tech/dbname?sslmode=require

# API Keys para la provisión algorítmica y procesamiento interno
OPENAI_API_KEY=sk-proveedor-llm
```

### GitHub y Notion: Centros Administrativos Bifurcados de la Operación

Para lograr colaboración escalable a lo largo de ciclos comerciales intensos, el flujo de trabajo separa categóricamente la "Teoría" de la "Práctica Operable":

1. **Notion como "Single Source of Knowledge" (Centro Neurálgico Documental):**
   La documentación administrativa centralizada proscribe desconexiones conceptuales. FUSA LABS deposita requerimientos íntegros, normativas operativas de los clientes, Declaraciones de Trabajo (SOW) y Arquitecturas MVP dentro del portal Notion corporativo de acceso de equipos (Lectura y Escritura unificada vía MCP transversal).
2. **GitHub como "Single Source of Truth" (Fuente Única de Verdad de Software):**
   GitHub alberga la base pragmática inmaculada de entrega. Las instancias receptivas ligadas a Vercel Pipeline (Deployments autogestionados y URLs de Preview temporales) se informan directamente frente a _Pull Requests_ visados formalmente. Nada entra al repositorio sin certificación.

---

## 🛡️ Políticas de Producción y Mantenimiento Corporativo

El despliegue en Vercel no es el fin del trabajo, es el comienzo de la operación en curso de la agencia.

### 1. Observabilidad y Monitoreo Proactivo

La regla es trabajar de forma proactiva usando datos reales, anticipándose a los problemas en vez de esperar a que el usuario reporte una falla.

- Se establece una orden obligatoria de utilización en los arranques productivos mediante sistemas de telemetría inyectada como **Vercel Analytics** o **Sentry**. Si un agente IA retorna error, entra en bucle, o un componente quiebra la ejecución local interrumpiendo un pago, los sistemas de registros corporativos priorizan y almacenan el evento instantáneamente.

### 2. Protocolo de Migraciones Continuas de Datos

El esquema mutará iterativamente cuando FUSA LABS y el Cliente decidan anexar mejoras al MVP en fase expansiva sobre base de datos Drizzle ORM Neon.

- Queda **prohibida la ejecución local manual** remota hacia infraestructuras conectivas de la matriz Productiva o Main con directrices terminales (por ejemplo, `drizzle-kit push`).
- **Pipeline Segregado:** Todo esquema alterado de datos se audita internamente (Git) y las conversiones Drizzle se ejecutan controladamente integradas siempre bajo paso formal programado dentro de pre-configuraciones CI/CD del equipo.

---

## 📝 Notas Adicionales y Propiedad Intelectual

Esta normativa materializa los estándares procedimentales de alto rendimiento de FUSA LABS. Subordina el manejo errático humano o de bots descontrolados frente al diseño modularizado (Components), al ciclo estricto arquitectónico de validación documental y productiva de SDD AI, blindando métricas comerciales frente al inversor hasta consolidación efectiva global.

_Documento estandarizado y redactado con propiedad para consumo interno del staff de **FUSA LABS**._
_(Versión Arquitectónica y Operativa: 30 de marzo de 2026) - Redactado por Jesús Fleitas._
