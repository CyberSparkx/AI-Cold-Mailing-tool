import "server-only";

export interface QueueJob<T = any> {
  id?: string;
  name: string;
  data: T;
  opts?: {
    delay?: number;
    attempts?: number;
    backoff?: {
      type: "fixed" | "exponential";
      delay: number;
    };
  };
}

export interface QueueDriver {
  addJob<T = any>(queueName: string, job: QueueJob<T>): Promise<string>;
  close(): Promise<void>;
}
