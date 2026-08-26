import { create } from "zustand";
import { Task } from "../db/schema/tasks";

export type TaskFilterType =
  | "all"
  | "today"
  | "upcoming"
  | "completed"
  | "p1"
  | "p2"
  | "p3"
  | "p4";

export interface TaskUIState {
  selectedDate: string; // YYYY-MM-DD
  activeFilter: TaskFilterType;
  selectedCourseId: string | null;
  selectedTaskId: string | null;
  searchQuery: string;
  isQuickAddOpen: boolean;
  optimisticOverrides: Record<string, Partial<Task> | null>; // null indicates optimistically deleted

  // Actions (Pure UI / interaction state)
  setSelectedDate: (date: string) => void;
  setActiveFilter: (filter: TaskFilterType) => void;
  setSelectedCourseId: (courseId: string | null) => void;
  setSelectedTaskId: (taskId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setQuickAddOpen: (isOpen: boolean) => void;
  setOptimisticOverride: (taskId: string, override: Partial<Task> | null) => void;
  removeOptimisticOverride: (taskId: string) => void;
  clearOptimisticOverrides: () => void;
  resetUIState: () => void;
}

function getTodayIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const useTaskStore = create<TaskUIState>((set) => ({
  selectedDate: getTodayIso(),
  activeFilter: "today",
  selectedCourseId: null,
  selectedTaskId: null,
  searchQuery: "",
  isQuickAddOpen: false,
  optimisticOverrides: {},

  setSelectedDate: (date: string) => set({ selectedDate: date }),
  setActiveFilter: (filter: TaskFilterType) => set({ activeFilter: filter }),
  setSelectedCourseId: (courseId: string | null) => set({ selectedCourseId: courseId }),
  setSelectedTaskId: (taskId: string | null) => set({ selectedTaskId: taskId }),
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setQuickAddOpen: (isOpen: boolean) => set({ isQuickAddOpen: isOpen }),

  setOptimisticOverride: (taskId: string, override: Partial<Task> | null) =>
    set((state) => ({
      optimisticOverrides: {
        ...state.optimisticOverrides,
        [taskId]: override,
      },
    })),

  removeOptimisticOverride: (taskId: string) =>
    set((state) => {
      const next = { ...state.optimisticOverrides };
      delete next[taskId];
      return { optimisticOverrides: next };
    }),

  clearOptimisticOverrides: () => set({ optimisticOverrides: {} }),

  resetUIState: () =>
    set({
      selectedDate: getTodayIso(),
      activeFilter: "today",
      selectedCourseId: null,
      selectedTaskId: null,
      searchQuery: "",
      isQuickAddOpen: false,
      optimisticOverrides: {},
    }),
}));
