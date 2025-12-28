// Logger utility to replace console statements
import React from "react";

class Logger {
  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.logLevel = import.meta.env.VITE_LOG_LEVEL || "info";
  }

  shouldLog(level) {
    if (!this.isDevelopment) return false;
    const levels = ["error", "warn", "info", "debug"];
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }

  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return [prefix, message, ...args];
  }

  error(message, ...args) {
    if (this.shouldLog("error")) {
      console.error(...this.formatMessage("error", message, ...args));
    }
  }

  warn(message, ...args) {
    if (this.shouldLog("warn")) {
      console.warn(...this.formatMessage("warn", message, ...args));
    }
  }

  info(message, ...args) {
    if (this.shouldLog("info")) {
      console.info(...this.formatMessage("info", message, ...args));
    }
  }

  debug(message, ...args) {
    if (this.shouldLog("debug")) {
      console.debug(...this.formatMessage("debug", message, ...args));
    }
  }

  // Performance logging
  time(label) {
    if (this.shouldLog("debug")) {
      console.time(label);
    }
  }

  timeEnd(label) {
    if (this.shouldLog("debug")) {
      console.timeEnd(label);
    }
  }

  // Component lifecycle logging
  componentMount(componentName) {
    this.debug(`Component mounted: ${componentName}`);
  }

  componentUnmount(componentName) {
    this.debug(`Component unmounted: ${componentName}`);
  }

  // API logging
  apiRequest(method, url, data) {
    this.debug(`API Request: ${method} ${url}`, data);
  }

  apiResponse(status, url, data) {
    this.debug(`API Response: ${status} ${url}`, data);
  }

  apiError(error, url) {
    this.error(`API Error: ${url}`, error);
  }

  // User action logging
  userAction(action, data) {
    this.info(`User Action: ${action}`, data);
  }

  // Error logging with stack trace
  logError(error, context = {}) {
    this.error("Application Error", {
      message: error.message,
      stack: error.stack,
      context,
    });
  }
}

export const logger = new Logger();

// Development-only debugging hook
export const useDevLogger = (componentName) => {
  React.useEffect(() => {
    logger.componentMount(componentName);
    return () => {
      logger.componentUnmount(componentName);
    };
  }, [componentName]);
};
