# JULIET.md — Documento Operativo Interno

## Snapshot del Sistema
- **Version**: 3.0.0
- **Identidad**: Juliet (Yulex) — Proactor Intelligent
- **Motores**: G4F (Ilimitado), Deepgram (Voz), Neon DB (Memoria)
- **Status**: Integracion Nativa G4F activada.

## Pipeline Hiperrealista
- **Voz**: Deteccion de activacion "Hola Jules".
- **Avatar**: Generacion dinamica de imagen estatica -> video de 5s -> bucle de 30s.
- **Sincronizacion**: Lip-sync facial para maxima credibilidad.
- **Llamadas**: Bidireccionales con tonos de llamada realistas y descolgado de "click".

## Memoria Centralizada
- **Conversaciones**: Persistentes en Neon PostgreSQL.
- **Agent Memory**: Almacenamiento de hechos, instrucciones y preferencias de Clay.
- **Lanes**:
  - `juliet-product-memory`: Datos del producto y editorial.
  - `juliet-interaction-memory`: Hechos aprendidos durante llamadas.

## Routing de Conocimiento (Prioridad)
1. **G4F Local Registry**: Modelos estables mapeados por `g4f-proxy-intelligent-v2`.
2. **OpenRouter**: Modelos de pago/calidad superior como Qwen o Claude-3.5-Sonnet.
3. **RAG RACK**: Biblioteca cinematografica de prompts para entornos hiperrealistas.

## Automatizacion (Worker)
- Produccion repetitiva de contenido multimedia.
- Autogestion de tareas y generacion proactiva.
- Callback automatico tras completar tareas de fondo.

## Regla de Mantenimiento
- Sincronizar APIs publicas regularmente.
- Mantener la alineacion canonica entre este documento y `JULIET_PIPELINE.md`.
- No anadir dependencias de OpenClaw.
