import { db } from "./db";
import { assessments, type InsertAssessment, type Assessment } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  getAssessment(id: number): Promise<Assessment | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const [created] = await db.insert(assessments).values(assessment).returning();
    return created;
  }

  async getAssessment(id: number): Promise<Assessment | undefined> {
    const [found] = await db.select().from(assessments).where(eq(assessments.id, id));
    return found;
  }
}

export const storage = new DatabaseStorage();
