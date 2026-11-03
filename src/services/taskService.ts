import type { TodoTask, TaskPriority, TaskCategory } from "@/types";
import {
  createDocument,
  deleteDocument,
  subscribeCollection,
  getCollection,
  updateDocument,
} from "./collectionService";

const NAME = "tasks";

export const TASK_CATEGORIES: TaskCategory[] = [
  "General",
  "Work",
  "Personal",
  "Bills & Payments",
  "Shopping",
  "Study",
  "Health",
  "Urgent",
];

export const TASK_PRIORITIES: { label: string; value: TaskPriority; color: string }[] = [
  { label: "High", value: "high", color: "text-red-600 bg-red-50 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800" },
  { label: "Medium", value: "medium", color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800" },
  { label: "Low", value: "low", color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800" },
];

export type TaskInput = Omit<TodoTask, "id" | "createdAt" | "updatedAt">;

export function subscribeTasks(
  uid: string,
  onData: (rows: TodoTask[]) => void,
  onError: (error: unknown) => void,
): () => void {
  return subscribeCollection<TodoTask>(uid, NAME, onData, onError);
}

export function getTasks(uid: string): Promise<TodoTask[]> {
  return getCollection<TodoTask>(uid, NAME);
}

export const addTask = (uid: string, input: TaskInput) =>
  createDocument(uid, NAME, input);

export const updateTask = (
  uid: string,
  id: string,
  input: Partial<TaskInput>,
) => updateDocument(uid, NAME, id, input);

export const deleteTask = (uid: string, id: string) =>
  deleteDocument(uid, NAME, id);

export const toggleTaskComplete = async (
  uid: string,
  task: TodoTask,
) => {
  const isScheduled = task.status === "scheduled";
  return updateDocument(uid, NAME, task.id, {
    status: isScheduled ? "completed" : "scheduled",
    completedAt: isScheduled ? new Date().toISOString() : undefined,
  });
};

export const clearCompletedTasks = async (
  uid: string,
  completedTasks: TodoTask[],
) => {
  return Promise.all(completedTasks.map((t) => deleteDocument(uid, NAME, t.id)));
};
