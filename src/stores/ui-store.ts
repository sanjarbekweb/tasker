import { create } from "zustand";

export type AppTab = "tasks" | "events" | "focus" | "profile";

export interface ToastMessage {
  id: string;
  message: string;
  type: "info" | "success" | "error";
  durationMs?: number;
}

export interface UIState {
  activeTab: AppTab;
  isQuickAddModalOpen: boolean;
  isRescheduleModalOpen: boolean;
  activeModalTaskId: string | null;
  activeModalEventId: string | null;
  toasts: ToastMessage[];

  // Actions
  setActiveTab: (tab: AppTab) => void;
  openQuickAddModal: () => void;
  closeQuickAddModal: () => void;
  openRescheduleModal: (taskId: string) => void;
  closeRescheduleModal: () => void;
  openEventModal: (eventId: string | null) => void;
  closeEventModal: () => void;
  addToast: (message: string, type?: "info" | "success" | "error", durationMs?: number) => void;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: "tasks",
  isQuickAddModalOpen: false,
  isRescheduleModalOpen: false,
  activeModalTaskId: null,
  activeModalEventId: null,
  toasts: [],

  setActiveTab: (tab: AppTab) => set({ activeTab: tab }),

  openQuickAddModal: () => set({ isQuickAddModalOpen: true }),
  closeQuickAddModal: () => set({ isQuickAddModalOpen: false }),

  openRescheduleModal: (taskId: string) =>
    set({
      isRescheduleModalOpen: true,
      activeModalTaskId: taskId,
    }),
  closeRescheduleModal: () =>
    set({
      isRescheduleModalOpen: false,
      activeModalTaskId: null,
    }),

  openEventModal: (eventId: string | null) =>
    set({
      activeModalEventId: eventId,
    }),
  closeEventModal: () =>
    set({
      activeModalEventId: null,
    }),

  addToast: (message: string, type: "info" | "success" | "error" = "info", durationMs: number = 3000) => {
    const id = crypto.randomUUID();
    const newToast: ToastMessage = { id, message, type, durationMs };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
  },

  dismissToast: (id: string) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  clearToasts: () => set({ toasts: [] }),
}));
