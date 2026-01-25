import { db } from "./db";
import { feedback, type InsertFeedback, type Feedback } from "@shared/schema";

export interface IStorage {
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
}

export class DatabaseStorage implements IStorage {
  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const [result] = await db.insert(feedback).values(insertFeedback).returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
