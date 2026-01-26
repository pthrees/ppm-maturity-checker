import { assessments, type InsertAssessment, type Assessment } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { getResendClient } from "./resend";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Email sending endpoint
  app.post("/api/send-report", async (req, res) => {
    try {
      const { email, name, assessmentId, htmlContent } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Save email to database immediately before attempting to send
      if (assessmentId) {
        const id = parseInt(assessmentId);
        if (!isNaN(id)) {
          await db.update(assessments)
            .set({ email })
            .where(eq(assessments.id, id));
        }
      }

      try {
        const { client, fromEmail } = await getResendClient();
        await client.emails.send({
          from: fromEmail,
          to: email,
          subject: `【診断結果】P3 PPM Maturity Checker レポート${name ? ` - ${name}様` : ""}`,
          html: htmlContent,
        });

        return res.status(200).json({ message: "Email sent successfully" });
      } catch (resendError) {
        console.error("Resend error:", resendError);
        // Even if email fails, the address is saved in DB, which is what the user wanted
        return res.status(200).json({ 
          message: "Email saved to database, but failed to send via Resend. Please check your Resend configuration.",
          error: String(resendError)
        });
      }
    } catch (err) {
      console.error("Email send error:", err);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  app.post(api.assessments.create.path, async (req, res) => {
    try {
      const input = api.assessments.create.input.parse(req.body);
      const assessment = await storage.createAssessment(input);
      res.status(201).json(assessment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.assessments.get.path, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(404).json({ message: "Invalid ID" });
    }
    const assessment = await storage.getAssessment(id);
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }
    res.json(assessment);
  });

  return httpServer;
}
