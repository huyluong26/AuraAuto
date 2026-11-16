'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  ConfirmDialogOptions,
  PromptDialogOptions,
  ToastItem,
  ToastType,
  DialogVariant,
} from '../types';
import { ConfirmDialogModal } from '../components/ui/ConfirmDialogModal';
import { PromptDialogModal } from '../components/ui/PromptDialogModal';
import { ToastContainer } from '../components/ui/ToastContainer';

interface AdminUIContextValue {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
  prompt: (options: PromptDialogOptions) => Promise<string | null>;
  alert: (title: string, message?: string, variant?: DialogVariant) => Promise<void>;
  toast: {
    (options: { type: ToastType; title: string; message?: string; duration?: number }): void;
    success: (title: string, message?: string, duration?: number) => void;
    error: (title: string, message?: string, duration?: number) => void;
    warning: (title: string, message?: string, duration?: number) => void;
    info: (title: string, message?: string, duration?: number) => void;
  };
}

const AdminUIContext = createContext<AdminUIContextValue | undefined>(undefined);

export function AdminUIProvider({ children }: { children: ReactNode }) {
  // Confirm modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmDialogOptions | null;
    resolve: ((value: boolean) => void) | null;
  }>({
    isOpen: false,
    options: null,
    resolve: null,
  });

  // Prompt modal state
  const [promptState, setPromptState] = useState<{
    isOpen: boolean;
    options: PromptDialogOptions | null;
    resolve: ((value: string | null) => void) | null;
  }>({
    isOpen: false,
    options: null,
    resolve: null,
  });

  // Toast stack state
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // 1. CONFIRM
  const confirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const handleConfirmClose = (result: boolean) => {
    if (confirmState.resolve) {
      confirmState.resolve(result);
    }
    setConfirmState({
      isOpen: false,
      options: null,
      resolve: null,
    });
  };

  // 2. PROMPT
  const prompt = useCallback((options: PromptDialogOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      setPromptState({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const handlePromptSubmit = (value: string) => {
    if (promptState.resolve) {
      promptState.resolve(value);
    }
    setPromptState({
      isOpen: false,
      options: null,
      resolve: null,
    });
  };

  const handlePromptCancel = () => {
    if (promptState.resolve) {
      promptState.resolve(null);
    }
    setPromptState({
      isOpen: false,
      options: null,
      resolve: null,
    });
  };

  // 3. ALERT (as a special confirm with only 1 confirm button and no cancel)
  const alert = useCallback((title: string, message?: string, variant: DialogVariant = 'primary'): Promise<void> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        options: {
          title,
          message: message || '',
          confirmText: 'Đã hiểu',
          cancelText: '',
          variant,
        },
        resolve: () => resolve(),
      });
    });
  }, []);

  // 4. TOAST
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({
      type,
      title,
      message,
      duration = 4000,
    }: {
      type: ToastType;
      title: string;
      message?: string;
      duration?: number;
    }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  // Helper properties on toast
  const toastObject = Object.assign(
    (opts: { type: ToastType; title: string; message?: string; duration?: number }) => addToast(opts),
    {
      success: (title: string, message?: string, duration?: number) =>
        addToast({ type: 'success', title, message, duration }),
      error: (title: string, message?: string, duration?: number) =>
        addToast({ type: 'error', title, message, duration }),
      warning: (title: string, message?: string, duration?: number) =>
        addToast({ type: 'warning', title, message, duration }),
      info: (title: string, message?: string, duration?: number) =>
        addToast({ type: 'info', title, message, duration }),
    }
  );

  return (
    <AdminUIContext.Provider
      value={{
        confirm,
        prompt,
        alert,
        toast: toastObject,
      }}
    >
      {children}

      {/* Global Admin Dialogs & Toasts */}
      <ConfirmDialogModal
        isOpen={confirmState.isOpen}
        options={confirmState.options}
        onConfirm={() => handleConfirmClose(true)}
        onCancel={() => handleConfirmClose(false)}
      />

      <PromptDialogModal
        isOpen={promptState.isOpen}
        options={promptState.options}
        onSubmit={handlePromptSubmit}
        onCancel={handlePromptCancel}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </AdminUIContext.Provider>
  );
}

export function useAdminUI(): AdminUIContextValue {
  const context = useContext(AdminUIContext);
  if (!context) {
    throw new Error('useAdminUI must be used within an AdminUIProvider');
  }
  return context;
}
