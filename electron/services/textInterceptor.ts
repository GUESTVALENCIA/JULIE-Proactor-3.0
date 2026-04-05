/**
 * TextInterceptor - Hook global de teclado para capturar texto de editores de codigo
 *
 * Intercepta todo lo que el usuario escribe en cualquier aplicacion (Cursor, VS Code, etc.)
 * y lo envia a Proactor para procesamiento.
 *
 * NOTA: Solo activo cuando Proactor esta en modo escucha.
 */

import { GlobalKeyboardListener, IGlobalKeyEvent, IGlobalKeyDownMap } from 'node-global-key-listener';

interface TextInterceptorConfig {
  enabled: boolean;
  bufferTimeout: number; // ms antes de enviar buffer
  minBufferLength: number; // minimo caracteres antes de enviar
  targetApps: string[]; // apps a monitorear (vacio = todas)
  excludeApps: string[]; // apps a excluir
}

interface CapturedText {
  text: string;
  app: string;
  timestamp: number;
}

type TextCallback = (captured: CapturedText) => void;

const DEFAULT_CONFIG: TextInterceptorConfig = {
  enabled: false,
  bufferTimeout: 2000,
  minBufferLength: 10,
  targetApps: [], // vacio = todas
  excludeApps: ['juliet-proactor', 'Juliet Proactor'], // excluir la propia app
};

// Mapeo de teclas especiales a caracteres
const KEY_MAP: Record<string, string> = {
  'SPACE': ' ',
  'RETURN': '\n',
  'TAB': '\t',
  'PERIOD': '.',
  'COMMA': ',',
  'SEMICOLON': ';',
  'QUOTE': "'",
  'OPEN BRACKET': '[',
  'CLOSE BRACKET': ']',
  'BACKSLASH': '\\',
  'FORWARD SLASH': '/',
  'MINUS': '-',
  'EQUALS': '=',
  'BACK QUOTE': '`',
};

// Teclas a ignorar
const IGNORE_KEYS = [
  'LEFT CTRL', 'RIGHT CTRL', 'LEFT ALT', 'RIGHT ALT',
  'LEFT SHIFT', 'RIGHT SHIFT', 'LEFT META', 'RIGHT META',
  'CAPS LOCK', 'NUM LOCK', 'SCROLL LOCK',
  'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
  'ESCAPE', 'PRINT SCREEN', 'PAUSE', 'INSERT', 'DELETE',
  'HOME', 'END', 'PAGE UP', 'PAGE DOWN',
  'UP ARROW', 'DOWN ARROW', 'LEFT ARROW', 'RIGHT ARROW',
];

export class TextInterceptor {
  private listener: GlobalKeyboardListener | null = null;
  private config: TextInterceptorConfig;
  private buffer: string = '';
  private bufferTimer: NodeJS.Timeout | null = null;
  private currentApp: string = 'unknown';
  private callbacks: Set<TextCallback> = new Set();

  constructor(config: Partial<TextInterceptorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  onText(callback: TextCallback): void {
    this.callbacks.add(callback);
  }

  offText(callback: TextCallback): void {
    this.callbacks.delete(callback);
  }

  async start(): Promise<boolean> {
    if (this.listener) {
      console.log('[TextInterceptor] Ya esta activo');
      return true;
    }

    try {
      this.listener = new GlobalKeyboardListener();

      this.listener.addListener((event: IGlobalKeyEvent, down: IGlobalKeyDownMap) => {
        if (event.state !== 'DOWN') return;
        if (IGNORE_KEYS.includes(event.name)) return;
        if (down['LEFT CTRL'] || down['RIGHT CTRL'] || down['LEFT ALT'] || down['RIGHT ALT']) {
          return;
        }

        let char = '';
        if (event.name.length === 1) {
          char = down['LEFT SHIFT'] || down['RIGHT SHIFT']
            ? event.name.toUpperCase()
            : event.name.toLowerCase();
        } else if (KEY_MAP[event.name]) {
          char = KEY_MAP[event.name];
        } else if (event.name === 'BACKSPACE') {
          this.buffer = this.buffer.slice(0, -1);
          return;
        }

        if (char) {
          this.buffer += char;
          this.scheduleFlush();
        }
      });

      this.config.enabled = true;
      console.log('[TextInterceptor] Captura de teclado global activa');
      return true;
    } catch (error) {
      console.error('[TextInterceptor] Error al iniciar:', error);
      return false;
    }
  }

  stop(): void {
    if (this.listener) {
      this.listener.kill();
      this.listener = null;
    }

    if (this.bufferTimer) {
      clearTimeout(this.bufferTimer);
      this.bufferTimer = null;
    }

    if (this.buffer.length > 0) {
      this.flush();
    }

    this.config.enabled = false;
    console.log('[TextInterceptor] Captura detenida');
  }

  private scheduleFlush(): void {
    if (this.bufferTimer) {
      clearTimeout(this.bufferTimer);
    }

    this.bufferTimer = setTimeout(() => {
      if (this.buffer.length >= this.config.minBufferLength) {
        this.flush();
      }
    }, this.config.bufferTimeout);
  }

  private flush(): void {
    if (this.buffer.length === 0) return;

    const captured: CapturedText = {
      text: this.buffer.trim(),
      app: this.currentApp,
      timestamp: Date.now(),
    };

    if (captured.text.length >= this.config.minBufferLength) {
      this.callbacks.forEach((cb) => {
        try {
          cb(captured);
        } catch (e) {
          console.error('[TextInterceptor] Error en callback:', e);
        }
      });
    }

    this.buffer = '';
  }

  setActiveApp(appName: string): void {
    if (this.currentApp !== appName && this.buffer.length > 0) {
      this.flush();
    }
    this.currentApp = appName;
  }

  isActive(): boolean {
    return this.config.enabled && this.listener !== null;
  }

  getBuffer(): string {
    return this.buffer;
  }
}

// Singleton para uso en main process
let textInterceptorInstance: TextInterceptor | null = null;

export function getTextInterceptor(): TextInterceptor {
  if (!textInterceptorInstance) {
    textInterceptorInstance = new TextInterceptor();
  }
  return textInterceptorInstance;
}

export function destroyTextInterceptor(): void {
  if (textInterceptorInstance) {
    textInterceptorInstance.stop();
    textInterceptorInstance = null;
  }
}
