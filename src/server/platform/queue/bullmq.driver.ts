import { Queue } from "bullmq";
import { QueueDriver, QueueJob } from "./queue.interface";
import { getRedisClient } from "../redis/client";
import { logger } from "../logger/logger";

export class BullMqDriver implements QueueDriver {
  private queues: Map<string, Queue> = new Map();

  private getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      const connection = getRedisClient();
      const queue = new Queue(name, {
        connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 10000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      });
      this.queues.set(name, queue);
    }
    return this.queues.get(name)!;
  }

  async addJob<T = any>(queueName: string, job: QueueJob<T>): Promise<string> {
    const queue = this.getQueue(queueName);
    const added = await queue.add(job.name, job.data, job.opts);
    logger.info({ queueName, jobName: job.name, jobId: added.id }, "Job enqueued to BullMQ");
    return added.id || "job_id";
  }

  async close(): Promise<void> {
    for (const queue of Array.from(this.queues.values())) {
      await queue.close();
    }
  }
}

export const queueDriver = new BullMqDriver();
