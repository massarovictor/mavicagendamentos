/**
 * Sistema de logging profissional para Mavic
 * Logs apenas em desenvolvimento, silencioso em produção
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  source?: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private createLogEntry(level: LogLevel, message: string, data?: any, source?: string): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      source
    };
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  debug(message: string, data?: any, source?: string) {
    const entry = this.createLogEntry('debug', message, data, source);
    this.addLog(entry);
    
    if (this.isDevelopment) {
      console.log(`🔍 [DEBUG] ${message}`, data ? data : '');
    }
  }

  info(message: string, data?: any, source?: string) {
    const entry = this.createLogEntry('info', message, data, source);
    this.addLog(entry);
    
    if (this.isDevelopment) {
      console.log(`ℹ️ [INFO] ${message}`, data ? data : '');
    }
  }

  warn(message: string, data?: any, source?: string) {
    const entry = this.createLogEntry('warn', message, data, source);
    this.addLog(entry);
    
    if (this.isDevelopment) {
      console.warn(`⚠️ [WARN] ${message}`, data ? data : '');
    }
  }

  error(message: string, error?: any, source?: string) {
    const entry = this.createLogEntry('error', message, error, source);
    this.addLog(entry);
    
    // Erros sempre são mostrados, mesmo em produção (mas sem dados sensíveis)
    if (this.isDevelopment) {
      console.error(`❌ [ERROR] ${message}`, error);
    } else {
      // Em produção, apenas a mensagem sem dados potencialmente sensíveis
      console.error(`[ERROR] ${message}`);
    }
  }

  // Método especial para logs de email (muito verboso)
  emailLog(message: string, data?: any) {
    if (this.isDevelopment) {
      console.log(`📧 [EMAIL] ${message}`, data ? data : '');
    }
  }

  // Método especial para logs de notificação
  notificationLog(message: string, data?: any) {
    if (this.isDevelopment) {
      console.log(`🔔 [NOTIFICATION] ${message}`, data ? data : '');
    }
  }

  // Método para obter logs (útil para debug)
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  // Limpar logs
  clearLogs() {
    this.logs = [];
  }

  // Exportar logs para debug
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Instância singleton
export const logger = new Logger();

// Exports para facilitar uso - bind para manter contexto
export const { debug, info, warn, error, emailLog, notificationLog } = {
  debug: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
  emailLog: logger.emailLog.bind(logger),
  notificationLog: logger.notificationLog.bind(logger)
}; 