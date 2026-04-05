# JULIE Proactor Intelligent v3.0.0

Aplicacion de escritorio **Electron + React (Vite)** para la orquestacion de **Juliet (Yulex)**, un agente de voz proactivo e hiperrealista con generacion de contenido multimedia, memoria persistente y automatizacion total.

## Stack Tecnico
| Capa | Tecnologia |
|---|---|
| Desktop | Electron 34 + vite-plugin-electron |
| Frontend | React 19 + Tailwind CSS v4 (Galaxy v2) |
| LLM | G4F Ilimitado + OpenRouter + OpenAI/Anthropic/Groq/DeepSeek |
| Voz STT | Deepgram Nova-2 (es-ES) |
| Voz TTS | Deepgram Aura-2 Karina-ES + Microsoft Edge TTS Elvira Neural |
| Memoria | Neon PostgreSQL (Serverless) |
| Orquestacion | MCP SDK + LangGraph + Temporal |
| Build | Vite 6 + TypeScript 5.9 |
| Empaquetado | electron-builder (NSIS) |

---

## Arquitectura de Archivos

### Electron Backend (`electron/`)
```
electron/
  main.ts                    # Entry point Electron, MCP HTTP server (:19875), window mgmt
  preload.ts                 # contextBridge → window.juliet.* (API bridge completa)
  electron-wrapper.mjs       # ESM wrapper para imports de Electron
  ipc/
    chat-runtime.ts          # Runtime LLM: G4F routing, fallback chain, tool calling, streaming
    chat.ipc.ts              # IPC handler: chat:send, chat:abort, chat:resume-after-auth
    voice.ipc.ts             # Deepgram STT/TTS, wake-word "Hola Jules", callbacks, avatar
    memory.ipc.ts            # Neon DB: conversations, messages, agent_memory, shared_vision
    mcp.ipc.ts               # MCP: tool catalog, PROACTOR_TOOLS_KNOWN, dynamic tools
    settings.ipc.ts          # electron-store: juliet-proactor/settings + secrets
    knowledge.ipc.ts         # Knowledge routing, Temporal, LangGraph integration
```

### React Frontend (`electron/src/`)
```
electron/src/
  main.tsx                   # React entry point
  app/
    App.tsx                  # Root: views (chat/settings/memory), VoiceCallModal, callbacks
    layout/
      ChatArea.tsx           # Chat principal: LLM streaming, tool trace, OAuth, system prompts
      WorkspaceChrome.tsx    # Shell completo: sidebar, panels, media gen, theme, ops monitor
      Sidebar.tsx            # "Proactor Intelligent" nav, sessions, plan badge
      TitleBar.tsx           # Titulo ventana, minimize/maximize/close
  components/
    chat/
      ChatInput.tsx          # Input de mensaje con attachment support
      MessageBubble.tsx      # Burbuja de mensaje con markdown rendering
      MessageList.tsx        # Lista scrollable de mensajes
      StreamingIndicator.tsx # Indicador de streaming activo
    voice/
      VoiceCallModal.tsx     # Modal llamada voz/avatar: Deepgram STT, TTS, barge-in
    settings/
      SettingsPanel.tsx      # API keys, providers, model catalog, ecosystem status
    memory/
      MemoryPanel.tsx        # Vista de memoria persistente Neon
    router/
      RouterMetrics.tsx      # Metricas de routing LLM en tiempo real
  core/
    settings/
      modelCatalog.ts        # Catalogo completo de modelos G4F ilimitados
  styles/
    index.css                # Galaxy v2: slate-950, glassmorphism, sky/indigo accents
  types/
    global.d.ts              # interface JulietAPI + Window { juliet: JulietAPI }
    index.ts                 # Type exports
```

### Scripts de Orquestacion Yulex (`scripts/`)
```
scripts/
  jules-mcp-server.ts       # Juliet Orchestrator MCP: shared_vision, memory, tasks, paperclip, supermemory
  task-watcher.ts            # HandOff: vigila local_tasks cada 30s, ejecuta tareas pendientes
  shared-memory-bridge.ts   # Neon DB shared_vision + sincronizacion SuperMemory API
  jules-memory-sync.ts      # CRUD jules_memory + local_tasks
  init-jules-db.ts           # Inicializador esquemas DB (jules_memory, local_tasks)
  configure-workers.ts       # Config workers G4F (Paperclip, TurboQuant, etc.)
  interconnect-google.ts     # Google Workspace CLI (GAM/GYB) integration
  g4f-proxy-intelligent-v2.cjs  # Proxy G4F: enrutamiento, rate limiting, model mapping
  smoke-test-yulex.ts        # Smoke test sistema Yulex
  launch-juliet.ps1          # PowerShell launcher blindado con mutex y fallback chain
```

### Configuracion Raiz
```
package.json                 # name: juliet-proactor, version: 3.0.0
vite.config.ts               # Vite + React + Tailwind v4 + vite-plugin-electron
electron-builder.yml         # appId: com.guestsvalencia.juliet-proactor
tsconfig.json                # TypeScript config
index.html                   # HTML entry (title: Juliet Proactor)
.env                         # API keys (no trackeado en git)
.mcp.json                    # MCP servers config (no trackeado)
.gitignore                   # node_modules, dist, .env, .mcp.json
launch-juliet.vbs            # Launcher silencioso (doble-click Desktop)
launch-juliet.cmd            # Launcher CLI
launch-juliet-debug.cmd      # Launcher con diagnostico de servicios
```

---

## Pipeline de Voz y Avatar

### Flujo de Llamada Completo
```
[Wake-word "Hola Jules"] → [3 Ringtones + Click conexion]
    ↓
[Deepgram Nova-2 STT] → transcripcion es-ES en tiempo real
    ↓
[G4F LLM] → modelo rotativo (gpt-5.2-pro, claude-opus-4.5, deepseek-v3.2-exp...)
    ↓                    fallback: OpenRouter → DeepSeek → Groq
[Deepgram Aura-2 TTS] → Karina-ES con Barge-in (interrupcion por voz del usuario)
    ↓
[Avatar Loop] → Imagen estatica (G4F/Pollinations)
             → Video 5-6s (transicion invisible)
             → Lip-sync facial
             → Bucle reproduccion 20-30s
    ↓
[Callback] → Juliet cuelga → ejecuta tarea → devuelve llamada automaticamente
```

### Actores de Voz
| Actor | Motor | Uso |
|---|---|---|
| `juliet` / `jules` | Deepgram Karina-ES (Aura-2) | Agente principal, conversacional |
| `sandra` | Microsoft Edge TTS Elvira Neural | Canal Nati/Natasha (sin censura) |

### Archivos Clave del Pipeline
- `electron/ipc/voice.ipc.ts:115` — Logica de actores y wake-word
- `electron/src/components/voice/VoiceCallModal.tsx` — UI del modal de llamada
- `electron/src/app/App.tsx:86-112` — Polling de callbacks y auto-incoming calls

---

## API Bridge: `window.juliet.*`

Definido en `electron/preload.ts`, tipado en `electron/src/types/global.d.ts`.

| Namespace | Funciones | Descripcion |
|---|---|---|
| `juliet.chat` | `send`, `abort`, `resumePendingAuth`, `onChunk`, `extractMemory` | Chat LLM con streaming |
| `juliet.voice` | `getDeepgramKey`, `sendToLLM`, `tts`, `queueCallback`, `dequeueReadyCallback` | Pipeline de voz |
| `juliet.memory` | `getConversations`, `saveMessage`, `getMemories`, `saveMemory`, `initSchema`, `jules.*`, `tasks.*` | Neon DB persistence |
| `juliet.settings` | `get`, `set`, `getSecret`, `setSecret`, `getAllKeys` | electron-store config |
| `juliet.mcp` | `getTools`, `callTool`, `getRuntimeHealth`, `connectServer` | MCP tools |
| `juliet.g4f` | `listProviders`, `listModels`, `testProviders` | G4F native |
| `juliet.knowledge` | `query`, `incident`, `refresh`, `syncSchedules`, `auditCoverage` | Knowledge routing |
| `juliet.directAuth` | `login`, `logout`, `refresh`, `getState`, `onStateChanged` | OAuth ChatGPT/Claude |
| `juliet.openrouter` | `listModels` | OpenRouter catalog |
| `juliet.window` | `minimize`, `maximize`, `close`, `isMaximized` | Window controls |
| `juliet.desktop` | `openPath`, `openExternal` | Shell integration |

---

## Base de Datos Neon PostgreSQL

### Tablas
| Tabla | Descripcion | Archivo Init |
|---|---|---|
| `conversations` | Historial de sesiones de chat | `memory.ipc.ts` |
| `messages` | Mensajes individuales por conversacion | `memory.ipc.ts` |
| `agent_memory` | Memoria persistente (category/key/content/confidence) | `memory.ipc.ts` |
| `shared_vision` | Vision compartida del sistema (topic/content/version) | `shared-memory-bridge.ts` |
| `jules_memory` | Memoria exclusiva de Juliet (category/key/content) | `init-jules-db.ts` |
| `local_tasks` | Cola de tareas HandOff (description/command/status/result) | `init-jules-db.ts` |
| `app_sessions` | Sesiones web para logica de inactividad HandOff | `task-watcher.ts` |

### Connection String
```
DATABASE_URL=postgresql://...@ep-lively-wildflower-ah01ljum-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

## Puertos y Servicios
| Puerto | Servicio | Estado |
|---|---|---|
| `:8080` | G4F Server principal | Externo |
| `:8082` | G4F Proxy Intelligent v2 | `scripts/g4f-proxy-intelligent-v2.cjs` |
| `:19875` | Electron MCP Server | `electron/main.ts` |
| `:8100` | juliet-mcp-local (tool forward) | Externo |

---

## Prioridad de Modelos LLM

Definido en `electron/ipc/chat-runtime.ts`:

1. **G4F Ilimitado** (`:8082`) — modelos rotativos con backoff automatico:
   `gpt-5.2-pro`, `claude-opus-4.5`, `deepseek-v3.2-exp`, `gpt-4o`, `gemini-3-pro`, `grok-4-fast`, `qwen-3-max`, `claude-3.7-sonnet`, `o3`, `llama-3.3-70b-turbo`, `gemini-3-flash`, `glm-4.7`, `minimax-m2.7-highspeed`, `kimi-k2-0905`, `deepseek-reasoner`, `gpt-oss-120b`

2. **OpenRouter** (`openrouter/auto`) — API key en `.env`
3. **DeepSeek Direct** — `deepseek-chat`
4. **Groq** — Llama fast inference
5. **OpenAI Direct** — con API key
6. **Anthropic Direct** — con API key

### Fallback Chain
```
G4F model backoff (429→2min, 401/403→30min) → pick next G4F model
    ↓ (all G4F exhausted)
OpenRouter auto → DeepSeek direct → G4F local reset
```

---

## Logica HandOff (Workers)

1. **Task Watcher** (`scripts/task-watcher.ts`): Cada 30s consulta `local_tasks` con status `pending`/`retry`
2. Si hay tareas, las ejecuta secuencialmente
3. Comandos shell se ejecutan via `exec()`, tareas IA se marcan `processed_by_juliet`
4. Resultado y estado se persisten en Neon DB + `shared_vision`
5. 12 workers activos: G4F, Paperclip, TurboQuant

---

## UI Galaxy v2

### Theme (CSS Custom Properties)
```css
--color-bg: #020617        /* slate-950 */
--color-panel: rgba(15,23,42,0.8)  /* glass */
--color-accent: #38bdf8    /* sky-400 */
--color-accent-2: #6366f1  /* indigo-500 */
```

### Clases Clave
- `.glass` — `backdrop-filter: blur(16px)` + borde translucido
- `.proactor-border` — `border-radius: 2rem`
- `.text-glow` — `text-shadow: 0 0 20px rgba(56,189,248,0.3)`
- `.card-shadow` — `box-shadow: 0 8px 32px rgba(0,0,0,0.37)`

---

## Comandos

### Desarrollo
```bash
npm run dev                              # Vite + Electron dev mode
npm run build                            # Compilar produccion
npm run dist                             # Build + electron-builder (.exe)
```

### Orquestacion Yulex
```bash
npx tsx scripts/init-jules-db.ts         # Crear esquemas DB
npx tsx scripts/jules-mcp-server.ts      # Iniciar Juliet Orchestrator MCP
npx tsx scripts/task-watcher.ts          # Iniciar vigilante HandOff
npx tsx scripts/configure-workers.ts     # Configurar workers G4F
npx tsx scripts/interconnect-google.ts   # Conectar Google Workspace
npx tsx scripts/smoke-test-yulex.ts      # Smoke test del sistema
```

### Temporal (Docker)
```bash
npm run temporal:start                   # Levantar Temporal Server
npm run temporal:stop                    # Detener Temporal
npm run temporal:health                  # Health check
npm run temporal:worker:start            # Iniciar worker
npm run temporal:supervisor:start        # Iniciar supervisor
```

---

## Politica de Integracion
- **Juliet** es el unico nombre oficial y la identidad principal.
- API bridge: `window.juliet.*` — nunca `window.sofia.*`.
- UI Galaxy v2: Slate-950, Glassmorphism, Rounded-2xl/3xl, Blue/Indigo Glow.
- Sin dependencias de OpenClaw.
- G4F nativo como motor LLM primario.
- Responder siempre en espanol, tono profesional Senior Google Engineer.

---

**FIRMA: JULIE (YULEX) PROACTOR INTELLIGENT v3.0.0**
