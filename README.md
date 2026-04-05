# JULIE Proactor Intelligent v3.0

Aplicacion de escritorio (Electron + React) para la orquestacion de **Juliet (Yulex)**, un agente de voz proactivo especializado en la generacion de contenido viral hiperrealista.

## Estado dinamico
- Ultima actualizacion: 2026-04-05
- Version app: 3.0.0
- Motor LLM: G4F (Ilimitado) + OpenRouter
- Motor Voz: Deepgram (Aura-2 Karina-ES)
- Memoria: Neon PostgreSQL (Persistente)
- Pipeline: Generacion de Avatar (Imagen a Video)

## Prioridad de consulta
1. G4F (Modelos gratuitos y estables)
2. OpenRouter (Modelos de alta calidad)
3. Biblioteca RAG RACK de prompts cinematograficos
4. Memoria persistente Neon

## Snapshot operativo
- Agente principal: Juliet (Yulex)
- Pipeline de medios: G4F Media Pipeline (Imagenes + Videos)
- Integracion de Voz: Deepgram con soporte para interrupcion (Barge-in)
- Modo Worker: Automatizacion de tareas repetitivas de produccion

## Comandos
```bash
npm run dev
npm run build
npm run sync:public-apis
npm run sync:docs
```

## Politica de integracion
- **Juliet** es el unico nombre oficial y la identidad principal del sistema.
- Se prioriza el realismo cinematografico y la interconexion total entre voz, imagen y video.
- No OpenClaw: El sistema es independiente de OpenClaw y utiliza G4F nativo.
- Todo lo visible debe estar conectado al estado real o marcado adecuadamente.
