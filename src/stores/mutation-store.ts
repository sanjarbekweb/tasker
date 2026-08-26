import { create } from "zustand";
import { globalMutationQueue, MutationRecord } from "../services/mutation-queue";

export interface MutationStoreState {
  mutations: MutationRecord[];
  pendingCount: number;
  failedCount: number;
  isProcessing: boolean;
}

export const useMutationStore = create<MutationStoreState>((set) => {
  // Subscribe to global mutation queue updates
  globalMutationQueue.subscribe((mutations) => {
    const pending = mutations.filter((m) => m.status === "pending" || m.status === "processing");
    const failed = mutations.filter((m) => m.status === "failed");

    set({
      mutations,
      pendingCount: pending.length,
      failedCount: failed.length,
      isProcessing: pending.length > 0,
    });
  });

  const initial = globalMutationQueue.getAll();
  const pending = initial.filter((m) => m.status === "pending" || m.status === "processing");
  const failed = initial.filter((m) => m.status === "failed");

  return {
    mutations: initial,
    pendingCount: pending.length,
    failedCount: failed.length,
    isProcessing: pending.length > 0,
  };
});
