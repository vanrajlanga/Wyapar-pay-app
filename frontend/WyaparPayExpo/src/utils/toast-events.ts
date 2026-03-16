/**
 * Toast Event Emitter
 * Allows showing toasts from anywhere in the app, including contexts and services
 */

import { ToastType } from '../components/ui/Toast';

type ToastEventCallback = (type: ToastType, title: string, message?: string) => void;

class ToastEventEmitter {
  private listeners: ToastEventCallback[] = [];

  subscribe(callback: ToastEventCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  emit(type: ToastType, title: string, message?: string): void {
    this.listeners.forEach((callback) => callback(type, title, message));
  }

  // Convenience methods
  success(title: string, message?: string): void {
    this.emit('success', title, message);
  }

  error(title: string, message?: string): void {
    this.emit('error', title, message);
  }

  warning(title: string, message?: string): void {
    this.emit('warning', title, message);
  }

  info(title: string, message?: string): void {
    this.emit('info', title, message);
  }
}

// Singleton instance
export const toastEvents = new ToastEventEmitter();

// Convenience functions for direct import
export const showToastEvent = (type: ToastType, title: string, message?: string) => {
  toastEvents.emit(type, title, message);
};

export const showSuccessEvent = (title: string, message?: string) => {
  toastEvents.success(title, message);
};

export const showErrorEvent = (title: string, message?: string) => {
  toastEvents.error(title, message);
};

export const showWarningEvent = (title: string, message?: string) => {
  toastEvents.warning(title, message);
};

export const showInfoEvent = (title: string, message?: string) => {
  toastEvents.info(title, message);
};
