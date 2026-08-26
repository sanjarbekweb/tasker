import { AppDatabase } from "../client";
import { CourseRepository } from "./course-repository";
import { TaskRepository } from "./task-repository";
import { SubtaskRepository } from "./subtask-repository";
import { EventRepository } from "./event-repository";
import { FocusSessionRepository } from "./focus-session-repository";
import { FocusStateRepository } from "./focus-state-repository";
import { PreferenceRepository } from "./preference-repository";
import { StatisticsCacheRepository } from "./statistics-cache-repository";

export * from "./course-repository";
export * from "./task-repository";
export * from "./subtask-repository";
export * from "./event-repository";
export * from "./focus-session-repository";
export * from "./focus-state-repository";
export * from "./preference-repository";
export * from "./statistics-cache-repository";

export interface Repositories {
  courses: CourseRepository;
  tasks: TaskRepository;
  subtasks: SubtaskRepository;
  events: EventRepository;
  focusSessions: FocusSessionRepository;
  focusState: FocusStateRepository;
  preferences: PreferenceRepository;
  statisticsCache: StatisticsCacheRepository;
}

export function createRepositories(db: AppDatabase): Repositories {
  return {
    courses: new CourseRepository(db),
    tasks: new TaskRepository(db),
    subtasks: new SubtaskRepository(db),
    events: new EventRepository(db),
    focusSessions: new FocusSessionRepository(db),
    focusState: new FocusStateRepository(db),
    preferences: new PreferenceRepository(db),
    statisticsCache: new StatisticsCacheRepository(db),
  };
}
