import { describe, it, expect, beforeEach } from "vitest";
import { MutationQueue } from "../src/services/mutation-queue";
import { useTaskStore } from "../src/stores/task-store";
import { useFocusStore } from "../src/stores/focus-store";
import { useFilterStore } from "../src/stores/filter-store";
import { useUIStore } from "../src/stores/ui-store";

describe("Mutation Queue & Zustand Stores", () => {
  describe("MutationQueue", () => {
    let queue: MutationQueue;

    beforeEach(() => {
      queue = new MutationQueue();
    });

    it("applies optimistic update immediately, commits on persistence success", async () => {
      let optimisticApplied = false;
      let persisted = false;

      const result = await queue.executeOptimistic({
        type: "COMPLETE_TASK",
        entityId: "task-123",
        payload: { isCompleted: true },
        onOptimisticApply: () => {
          optimisticApplied = true;
        },
        persist: async () => {
          persisted = true;
          return { id: "task-123", isCompleted: true };
        },
      });

      expect(optimisticApplied).toBe(true);
      expect(persisted).toBe(true);
      expect(result.isCompleted).toBe(true);

      const records = queue.getAll();
      expect(records.length).toBe(1);
      expect(records[0]?.status).toBe("applied");
      expect(records[0]?.error).toBeNull();
    });

    it("executes rollback callback and records error when persistence fails", async () => {
      let rolledBack = false;
      let rollbackPayloadCaptured: unknown = null;

      await expect(
        queue.executeOptimistic({
          type: "DELETE_TASK",
          entityId: "task-456",
          payload: { id: "task-456" },
          rollbackPayload: { previousTitle: "Original Task" },
          persist: async () => {
            throw new Error("Disk write error");
          },
          onRollback: (payload) => {
            rolledBack = true;
            rollbackPayloadCaptured = payload;
          },
        })
      ).rejects.toThrow("Disk write error");

      expect(rolledBack).toBe(true);
      expect(rollbackPayloadCaptured).toEqual({ previousTitle: "Original Task" });

      const records = queue.getAll();
      expect(records.length).toBe(1);
      expect(records[0]?.status).toBe("rolled_back");
      expect(records[0]?.error).toBe("Disk write error");
    });
  });

  describe("Zustand Stores", () => {
    beforeEach(() => {
      useTaskStore.getState().resetUIState();
      useFocusStore.getState().reset();
      useFilterStore.getState().resetFilters();
      useUIStore.getState().clearToasts();
    });

    it("useTaskStore manages UI state and optimistic overrides", () => {
      const store = useTaskStore.getState();

      store.setSelectedDate("2026-08-30");
      store.setActiveFilter("p1");
      store.setSearchQuery("Algebra");
      store.setQuickAddOpen(true);
      store.setOptimisticOverride("task-1", { isCompleted: true });

      const updated = useTaskStore.getState();
      expect(updated.selectedDate).toBe("2026-08-30");
      expect(updated.activeFilter).toBe("p1");
      expect(updated.searchQuery).toBe("Algebra");
      expect(updated.isQuickAddOpen).toBe(true);
      expect(updated.optimisticOverrides["task-1"]).toEqual({ isCompleted: true });

      store.removeOptimisticOverride("task-1");
      expect(useTaskStore.getState().optimisticOverrides["task-1"]).toBeUndefined();
    });

    it("useFocusStore calculates remaining seconds and handles background recovery", () => {
      const store = useFocusStore.getState();
      const now = 1000000;
      const targetAt = now + 25 * 60 * 1000;

      store.syncFromPersistentState(
        {
          mode: "work",
          status: "running",
          startedAt: now,
          targetAt,
          pausedAt: null,
          updatedAt: now,
        },
        now
      );

      expect(useFocusStore.getState().status).toBe("running");
      expect(useFocusStore.getState().remainingSeconds).toBe(1500);

      // Advance 100 seconds
      store.tick(now + 100 * 1000);
      expect(useFocusStore.getState().remainingSeconds).toBe(1400);

      // Simulate resume after target elapsed
      const isElapsed = store.handleResumeFromBackground(targetAt + 1000);
      expect(isElapsed).toBe(true);
      expect(useFocusStore.getState().status).toBe("completed");
      expect(useFocusStore.getState().remainingSeconds).toBe(0);
    });

    it("useFilterStore and useUIStore manage presentation modal and filter states", () => {
      const filterStore = useFilterStore.getState();
      const uiStore = useUIStore.getState();

      filterStore.setTaskPriority("p1");
      filterStore.setViewMode("calendar");
      expect(useFilterStore.getState().taskPriority).toBe("p1");
      expect(useFilterStore.getState().viewMode).toBe("calendar");

      uiStore.openQuickAddModal();
      expect(useUIStore.getState().isQuickAddModalOpen).toBe(true);
      uiStore.closeQuickAddModal();
      expect(useUIStore.getState().isQuickAddModalOpen).toBe(false);

      uiStore.addToast("Task created successfully", "success");
      expect(useUIStore.getState().toasts.length).toBe(1);
      expect(useUIStore.getState().toasts[0]?.message).toBe("Task created successfully");
    });
  });
});
