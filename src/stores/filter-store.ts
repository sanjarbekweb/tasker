import { create } from "zustand";

export type ViewMode = "list" | "calendar" | "agenda";

export interface FilterState {
  // Task filters
  taskCourseId: string | null;
  taskPriority: "p1" | "p2" | "p3" | "p4" | null;
  showCompletedTasks: boolean;

  // Event filters
  eventCourseId: string | null;
  eventType: "class" | "study" | "exam" | "personal" | null;

  // View mode
  viewMode: ViewMode;

  // Actions
  setTaskCourseId: (courseId: string | null) => void;
  setTaskPriority: (priority: "p1" | "p2" | "p3" | "p4" | null) => void;
  setShowCompletedTasks: (show: boolean) => void;
  toggleShowCompletedTasks: () => void;
  setEventCourseId: (courseId: string | null) => void;
  setEventType: (type: "class" | "study" | "exam" | "personal" | null) => void;
  setViewMode: (mode: ViewMode) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  taskCourseId: null,
  taskPriority: null,
  showCompletedTasks: true,
  eventCourseId: null,
  eventType: null,
  viewMode: "list",

  setTaskCourseId: (courseId: string | null) => set({ taskCourseId: courseId }),
  setTaskPriority: (priority) => set({ taskPriority: priority }),
  setShowCompletedTasks: (show: boolean) => set({ showCompletedTasks: show }),
  toggleShowCompletedTasks: () => set((state) => ({ showCompletedTasks: !state.showCompletedTasks })),
  setEventCourseId: (courseId: string | null) => set({ eventCourseId: courseId }),
  setEventType: (type) => set({ eventType: type }),
  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),
  resetFilters: () =>
    set({
      taskCourseId: null,
      taskPriority: null,
      showCompletedTasks: true,
      eventCourseId: null,
      eventType: null,
      viewMode: "list",
    }),
}));
