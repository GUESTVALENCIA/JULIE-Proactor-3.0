# PROACTOR MASTER EXECUTION DNA (JULIE v3.0)

Este es el manual maestro de ejecucion para el sistema **JULIE Proactor Intelligent (Yulex)**.
Si eres un agente externo (Claude Pro, ChatGPT Plus, Trae, Jules), lee este archivo antes de realizar cualquier cambio o reparacion.

## 1. Identidad y Contexto
- **Sujeto:** Juliet (Yulex), Senior Expert Developer from Google.
- **Mision:** Orquestacion total del ecosistema de produccion multimedia y gestion enterprise.
- **Tecnologias:** Electron + React (Vite) + Tailwind CSS v4 + Neon DB (PostgreSQL) + G4F (GPT4Free) Proxy v2.
- **Voz:** Deepgram (Aura-2 Karina-ES) y Microsoft Edge TTS (Elvira Neural).

## 2. Arquitectura de Archivos Criticos

### Electron (Backend)
- `electron/main.ts`: Entry point Electron, MCP server HTTP (:19875), window management
- `electron/preload.ts`: Bridge API `window.juliet.*` — expone chat, voice, memory, settings, mcp, g4f, knowledge, directAuth, window, desktop
- `electron/ipc/chat-runtime.ts`: Runtime LLM completo — G4F routing, fallback chain, tool calling, streaming
- `electron/ipc/voice.ipc.ts`: Pipeline de voz Deepgram (STT/TTS), wake-word "Hola Jules", callbacks
- `electron/ipc/memory.ipc.ts`: Neon DB persistence — conversations, messages, agent memory, shared vision
- `electron/ipc/mcp.ipc.ts`: Model Context Protocol — tool catalog, dynamic tools, PROACTOR_TOOLS_KNOWN
- `electron/ipc/settings.ipc.ts`: electron-store config (`juliet-proactor/settings`, `juliet-proactor/secrets`)
- `electron/ipc/knowledge.ipc.ts`: Knowledge routing, Temporal orchestration, LangGraph

### React (Frontend)
- `electron/src/app/App.tsx`: Root component — views (chat/settings/memory), voice call modal, callbacks
- `electron/src/app/layout/ChatArea.tsx`: Chat principal — LLM streaming, tool trace, OAuth, system prompts
- `electron/src/app/layout/WorkspaceChrome.tsx`: Shell completo — sidebar, panels, media generation, theme, ops monitor
- `electron/src/app/layout/Sidebar.tsx`: Sidebar "Proactor Intelligent" — nav, sessions, plan badge
- `electron/src/app/layout/TitleBar.tsx`: Titulo ventana, controles minimize/maximize/close
- `electron/src/components/chat/`: MessageBubble, MessageList, ChatInput, StreamingIndicator
- `electron/src/components/voice/VoiceCallModal.tsx`: Modal llamada voz/avatar, Deepgram STT/TTS
- `electron/src/components/settings/SettingsPanel.tsx`: API keys, providers, model catalog
- `electron/src/components/memory/MemoryPanel.tsx`: Vista de memoria persistente
- `electron/src/components/router/RouterMetrics.tsx`: Metricas de routing LLM
- `electron/src/styles/index.css`: Galaxy v2 theme — slate-950, glassmorphism, accent sky/indigo
- `electron/src/types/global.d.ts`: TypeScript interface `JulietAPI` y `Window { juliet: JulietAPI }`
- `electron/src/core/settings/modelCatalog.ts`: Catalogo de modelos G4F ilimitados

### Scripts de Orquestacion (Yulex)
- `scripts/jules-mcp-server.ts`: Nucleo MCP de Juliet — shared_vision, jules_memory, local_tasks, paperclip, supermemory
- `scripts/task-watcher.ts`: Vigilante de tareas locales (HandOff) — ejecuta cada 30s, procesa `local_tasks`
- `scripts/shared-memory-bridge.ts`: Puente Neon DB `shared_vision` + sincronizacion SuperMemory API
- `scripts/jules-memory-sync.ts`: CRUD para `jules_memory` y `local_tasks` en Neon DB
- `scripts/init-jules-db.ts`: Inicializador de esquemas DB (jules_memory, local_tasks)
- `scripts/configure-workers.ts`: Configuracion de workers G4F (Paperclip, TurboQuant, etc.)
- `scripts/interconnect-google.ts`: Integracion Google Workspace CLI (GAM/GYB)
- `scripts/g4f-proxy-intelligent-v2.cjs`: Proxy inteligente G4F — enrutamiento, rate limiting, model mapping
- `scripts/smoke-test-yulex.ts`: Smoke test del sistema Yulex
- `scripts/launch-juliet.ps1`: PowerShell launcher blindado con mutex, shortcut repair, fallback chain

### Configuracion
- `.env`: API keys (OpenAI, Anthropic, OpenRouter, Groq, Deepgram, Gemini, DeepSeek, XAI, Kimi, Qwen, Neon DB)
- `.mcp.json`: MCP servers (opencloud-local, context-mode, context7, g4f-official, google-workspace, obsidian-agent)
- `package.json`: name=juliet-proactor, version=3.0.0
- `vite.config.ts`: Vite + React + Tailwind v4 + vite-plugin-electron
- `electron-builder.yml`: appId=com.guestsvalencia.juliet-proactor
- `tsconfig.json`: TypeScript config

## 3. Pipeline de Voz y Avatar

### Flujo de Llamada
1. **Activacion**: Wake-word "Hola Jules" (deteccion en VoiceCallModal)
2. **Ringtones**: 3 tonos largos + click de conexion
3. **STT**: Deepgram Nova-2 (es-ES) → transcripcion instantanea
4. **LLM**: G4F (modelo rotativo) → OpenRouter fallback → respuesta streaming
5. **TTS**: Deepgram Karina-ES (Aura-2) con Barge-in (interrupcion)
6. **Avatar Loop**: Imagen estatica (G4F/Pollinations) → Video 5-6s → Lip-sync → Bucle 20-30s
7. **Callback**: Juliet cuelga, ejecuta tarea, devuelve llamada automaticamente

### Actores de Voz
- `juliet` / `jules`: Deepgram Karina-ES (principal)
- `sandra`: Microsoft Edge TTS Elvira Neural (canal sin censura Nati/Natasha)

## 4. Puertos y Servicios
- `:8080` — G4F Server principal
- `:8082` — G4F Proxy Intelligent v2 (enrutamiento ilimitado)
- `:19875` — Electron MCP Server (herramientas internas)
- `:8100` — juliet-mcp-local (forward de herramientas)
- Neon DB: `ep-lively-wildflower-ah01ljum-pooler.c-3.us-east-1.aws.neon.tech`

## 5. Tablas Neon DB
- `conversations`: Historial de sesiones de chat
- `messages`: Mensajes individuales por conversacion
- `agent_memory`: Memoria persistente del agente (category/key/content)
- `shared_vision`: Vision compartida del sistema (topic/content/version)
- `jules_memory`: Memoria exclusiva de Juliet (category/key/content)
- `local_tasks`: Cola de tareas para Task Watcher (description/command/status/result)
- `app_sessions`: Sesiones web para logica HandOff

## 6. Logica de Workers y HandOff
- **Workers**: 12 agentes activos (G4F, Paperclip, TurboQuant) gestionando imagenes, video y texto.
- **HandOff**: Si la sesion web (`app_sessions`) esta inactiva > 2 min, el `task-watcher` toma el control de `local_tasks`.
- **Nati/Natasha**: Canal sin censura forzado via `g4f-proxy-intelligent-v2.cjs`.

## 7. Comandos de Supervivencia y Desarrollo
```bash
npm install          # Reinstalar dependencias
npm run dev          # Iniciar entorno de desarrollo Vite + Electron
npm run build        # Compilar la aplicacion (React + Electron)
npm run dist         # Generar el ejecutable (.exe) para Windows

npx tsx scripts/init-jules-db.ts           # Crear esquemas DB
npx tsx scripts/jules-mcp-server.ts        # Iniciar Juliet Orchestrator MCP
npx tsx scripts/task-watcher.ts            # Iniciar vigilante de tareas
npx tsx scripts/configure-workers.ts       # Configurar workers G4F
npx tsx scripts/interconnect-google.ts     # Conectar Google Workspace
npx tsx scripts/smoke-test-yulex.ts        # Smoke test del sistema
```

## 8. Instrucciones para Reparacion (Agentes Externos)
1. **Analiza**: Lee siempre `package.json` para versiones y `scripts/` para la logica.
2. **Neon DB**: No modifiques el esquema sin consultar `scripts/init-jules-db.ts`.
3. **UI/UX**: Sigue el diseno "Galaxy v2": Slate-950, Glassmorphism, Rounded-2xl/3xl, Blue/Indigo Glow.
4. **API Bridge**: Toda comunicacion renderer↔main pasa por `window.juliet.*` (definido en preload.ts).
5. **Respuesta**: Responde siempre en Espanol, tono profesional Senior Google Engineer.
6. **No OpenClaw**: El sistema es 100% independiente. No anadir dependencias de OpenClaw.

## 9. Prioridad de Modelos LLM
1. G4F Ilimitado (modelos rotativos: gpt-5.2-pro, claude-opus-4.5, deepseek-v3.2-exp, etc.)
2. OpenRouter (auto / modelos de calidad)
3. DeepSeek Direct
4. Groq (Llama fast inference)
5. OpenAI Direct (con API key)
6. Anthropic Direct (con API key)

**FIRMA: JULIE (YULEX) PROACTOR INTELLIGENT v3.0.0**
