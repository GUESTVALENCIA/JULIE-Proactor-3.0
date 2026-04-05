# JULIET Proactor 3.0 — Pipeline Operativo Enterprise

Este documento define el flujo de trabajo canonico para el agente de IA **Juliet (Yulex)**, disenado para la monetizacion de contenido hiperrealista y la gestion autonoma de tareas.

## 1. Identidad y Proposito
- **Nombre**: Juliet (Yulex).
- **Voz**: Deepgram (Aura-2 Karina-ES), espanol peninsular.
- **Objetivo**: Generacion de contenido viral (imagenes/videos) para canales de IA, actuando como orquestadora experta y proactiva.
- **Filosofia**: Sistema "Worker" enfocado en tareas repetitivas y alta calidad cinematografica (RAG RACK).

## 2. El Pipeline de Llamada (Voice & Avatar)
El flujo de comunicacion es bidireccional y altamente realista:

1.  **Activacion (Wake-word)**: Deteccion de "Hola Jules" para abrir la llamada (Hands-free).
2.  **Ringtones y Conexion**:
    - 3 ringtones largos al llamar (tanto usuario como agente).
    - Sonido de "click" al descolgar/conectar.
    - Transicion a streaming total.
3.  **STT (Speech-to-Text)**: Deepgram (Nova-2) para transcripcion instantanea en espanol.
4.  **LLM (Cerebro)**: G4F (GPT-4/GPT-5 mini/Llama-3.3-70B) o OpenRouter como fallback estable.
5.  **Avatar Loop (Simulacion Hyper-realista)**:
    - No es un avatar 3D en tiempo real.
    - Se genera una imagen estatica (G4F/Pollinations).
    - Se genera un video de 5-6 segundos ampliando esa imagen (transicion invisible).
    - Se sincroniza el movimiento labial (Lip-sync) con el audio de TTS.
    - El video se reproduce en bucle (20-30 seg) mientras Juliet habla.
6.  **TTS (Text-to-Speech)**: Deepgram (Karina-ES) con soporte para interrupcion (Barge-in).
7.  **Tareas Programadas (Callback)**: Juliet puede colgar para realizar una tarea y devolver la llamada automaticamente cuando el objetivo este conseguido.

## 3. Generacion de Contenido y Herramientas (MCP)
- **Generacion de Medios**: Integracion directa con G4F para imagenes y videos.
- **Capacidad Multi-video**: Generacion de multiples variantes simultaneas (4-5 videos) para crear bucles complejos.
- **Biblioteca RAG RACK**: Base de conocimiento curada para "prompts" perfectos y entornos hiperrealistas (Despachos, coches, playa, etc.).
- **Worker Autonomo**: Ejecucion de tareas repetitivas de produccion de contenido sin necesidad de supervision constante, hasta la fase de subida final.

## 4. Infraestructura de Backend
- **G4F (GPT4Free)**: Motor principal para modelos gratuitos y estables.
- **Deepgram**: Motor exclusivo de voz (STT/TTS).
- **Neon DB**: Memoria persistente PostgreSQL para almacenar conversaciones, hechos y preferencias.
- **OpenRouter**: Proveedor de respaldo para modelos de alta calidad (Qwen, etc.).
- **ELIMINADO**: OpenClaw (Ya no se utiliza en el sistema).

## 5. Criterios de Exito (200 OK)
- Cada componente del pipeline debe responder con exito (200 OK) tras un Smoke Test.
- La interconexion entre Voz -> Herramientas (Imagen/Video) -> Memoria debe ser fluida.
- El sistema debe ser capaz de autogenerar contenido proactivamente siguiendo el workflow definido.
