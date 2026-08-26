import { Task } from "../../db/schema/tasks";
import { Subtask } from "../../db/schema/subtasks";

export interface TaskFilterCriteria {
  searchQuery?: string;
  courseId?: string | null;
  priority?: "p1" | "p2" | "p3" | "p4";
  isCompleted?: boolean;
  dueDate?: string | null;
  overdueOnly?: boolean;
}

const PRIORITY_ORDER: Record<string, number> = {
  p1: 1,
  p2: 2,
  p3: 3,
  p4: 4,
};

/**
 * Pure task sorting function.
 * 1. Incomplete before completed
 * 2. orderIndex ascending
 * 3. Priority ascending (p1 high to p4 low)
 * 4. Due date ascending
 */
export function sortTasks(taskList: Task[]): Task[] {
  return [...taskList].sort((a, b) => {
    // 1. Completion status
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }

    // 2. Order index
    if (a.orderIndex !== b.orderIndex) {
      return a.orderIndex - b.orderIndex;
    }

    // 3. Priority
    const pA = PRIORITY_ORDER[a.priority] ?? 4;
    const pB = PRIORITY_ORDER[b.priority] ?? 4;
    if (pA !== pB) {
      return pA - pB;
    }

    // 4. Due date
    if (a.dueDate && b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;

    return a.createdAt - b.createdAt;
  });
}

/**
 * Pure task filtering function based on search query, status, course, priority, and dates.
 */
export function filterTasks(
  taskList: Task[],
  criteria: TaskFilterCriteria,
  referenceIsoDate: string = new Date().toISOString().slice(0, 10)
): Task[] {
  return taskList.filter((task) => {
    if (criteria.isCompleted !== undefined && task.isCompleted !== criteria.isCompleted) {
      return false;
    }

    if (criteria.courseId !== undefined && task.courseId !== criteria.courseId) {
      return false;
    }

    if (criteria.priority !== undefined && task.priority !== criteria.priority) {
      return false;
    }

    if (criteria.dueDate !== undefined && task.dueDate !== criteria.dueDate) {
      return false;
    }

    if (criteria.overdueOnly) {
      if (task.isCompleted || !task.dueDate || task.dueDate >= referenceIsoDate) {
        return false;
      }
    }

    if (criteria.searchQuery && criteria.searchQuery.trim()) {
      const query = criteria.searchQuery.toLowerCase().trim();
      const matchTitle = task.title.toLowerCase().includes(query);
      const matchDescription = task.description?.toLowerCase().includes(query) ?? false;
      if (!matchTitle && !matchDescription) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Checks if a task is overdue relative to an ISO reference date.
 */
export function isTaskOverdue(
  task: Task,
  referenceIsoDate: string = new Date().toISOString().slice(0, 10)
): boolean {
  if (task.isCompleted || !task.dueDate) return false;
  return task.dueDate < referenceIsoDate;
}

/**
 * Calculates subtask completion count and progress ratio.
 */
export function calculateSubtaskProgress(subtaskList: Subtask[]): {
  total: number;
  completed: number;
  progress: number; // 0.0 to 1.0
} {
  const active = subtaskList.filter((s) => !s.deletedAt);
  const total = active.length;
  if (total === 0) {
    return { total: 0, completed: 0, progress: 1.0 };
  }
  const completed = active.filter((s) => s.isCompleted).length;
  return {
    total,
    completed,
    progress: completed / total,
  };
}

