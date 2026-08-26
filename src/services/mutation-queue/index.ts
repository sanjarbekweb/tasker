import { z } from "zod";
import { DatabaseError, ValidationError, NotFoundError } from "../../db/errors";

export type MutationType =
  | "CREATE_TASK"
  | "UPDATE_TASK"
  | "COMPLETE_TASK"
  | "DELETE_TASK"
  | "CREATE_EVENT"
  | "UPDATE_EVENT"
  | "DELETE_EVENT"
  | "CUSTOM";

export type MutationStatus = "pending" | "processing" | "applied" | "failed" | "rolled_back";

export interface MutationRecord<TPayload = unknown, TRollback = unknown> {
  id: string;
  type: MutationType;
  entityId: string;
  payload: TPayload;
  rollbackPayload?: TRollback;
  createdAt: number;
  status: MutationStatus;
  retryCount: number;
  maxRetries: number;
  error?: string | null;
}

export type MutationListener = (queue: MutationRecord[]) => void;

export class MutationQueue {
  private queue: Map<string, MutationRecord> = new Map();
  private listeners: Set<MutationListener> = new Set();

  subscribe(listener: MutationListener): () => void {
    this.listeners.add(listener);
    listener(this.getAll());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const records = this.getAll();
    this.listeners.forEach((l) => l(records));
  }

  getAll(): MutationRecord[] {
    return Array.from(this.queue.values()).sort((a, b) => a.createdAt - b.createdAt);
  }

  getPending(): MutationRecord[] {
    return this.getAll().filter((m) => m.status === "pending" || m.status === "processing");
  }

  getFailed(): MutationRecord[] {
    return this.getAll().filter((m) => m.status === "failed");
  }

  get(id: string): MutationRecord | undefined {
    return this.queue.get(id);
  }

  /**
   * Executes an optimistic mutation:
   * 1. Applies optimistic UI state immediately via onOptimisticApply
   * 2. Runs the persistent repository operation
   * 3. If persistence succeeds, marks mutation as applied
   * 4. If persistence fails, executes onRollback and marks mutation as rolled_back/failed
   */
  async executeOptimistic<TResult, TPayload = unknown, TRollback = unknown>(options: {
    type: MutationType;
    entityId: string;
    payload: TPayload;
    rollbackPayload?: TRollback;
    maxRetries?: number;
    onOptimisticApply?: (payload: TPayload) => void;
    persist: () => Promise<TResult>;
    onRollback?: (rollbackPayload?: TRollback, error?: unknown) => void;
    onSuccess?: (result: TResult) => void;
  }): Promise<TResult> {
    const mutationId = crypto.randomUUID();
    const mutation: MutationRecord<TPayload, TRollback> = {
      id: mutationId,
      type: options.type,
      entityId: options.entityId,
      payload: options.payload,
      rollbackPayload: options.rollbackPayload,
      createdAt: Date.now(),
      status: "processing",
      retryCount: 0,
      maxRetries: options.maxRetries ?? 0,
      error: null,
    };

    this.queue.set(mutationId, mutation as MutationRecord);
    this.notify();

    // 1. Optimistic apply
    if (options.onOptimisticApply) {
      try {
        options.onOptimisticApply(options.payload);
      } catch (err) {
        // If optimistic UI update itself fails, abort without persistence
        mutation.status = "failed";
        mutation.error = err instanceof Error ? err.message : "Optimistic apply failed";
        this.notify();
        throw err;
      }
    }

    // 2. Persistence execution
    try {
      const result = await options.persist();
      mutation.status = "applied";
      mutation.error = null;
      this.notify();

      if (options.onSuccess) {
        options.onSuccess(result);
      }
      return result;
    } catch (error) {
      // 3. Rollback on failure
      mutation.status = "rolled_back";
      mutation.error = error instanceof Error ? error.message : "Persistence failed";
      this.notify();

      if (options.onRollback) {
        try {
          options.onRollback(options.rollbackPayload, error);
        } catch (rollbackErr) {
          console.error("Error during mutation rollback:", rollbackErr);
        }
      }

      throw error;
    }
  }

  clearApplied(): void {
    for (const [id, record] of this.queue.entries()) {
      if (record.status === "applied" || record.status === "rolled_back") {
        this.queue.delete(id);
      }
    }
    this.notify();
  }

  clearAll(): void {
    this.queue.clear();
    this.notify();
  }
}

// Global singleton mutation queue
export const globalMutationQueue = new MutationQueue();
