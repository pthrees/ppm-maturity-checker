import { assessments, type InsertAssessment, type Assessment } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import nodemailer from "nodemailer";

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

      // For demo purposes, we'll use a test account or a placeholder
      // In a real app, you'd use environment secrets for SMTP credentials
      const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: (process.env as any).SMTP_USER || "placeholder",
          pass: (process.env as any).SMTP_PASS || "placeholder",
        },
      });

      // If no real SMTP config is provided, we just log it and return success
      // In Replit environment without secrets set, we should handle this gracefully
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log(`[Email Simulation] To: ${email}, Name: ${name}, Assessment: ${assessmentId}`);
        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        return res.status(200).json({ message: "Email simulated successfully" });
      }

      await transporter.sendMail({
        from: '"PPM Maturity Diagnostic" <noreply@example.com>',
        to: email,
        subject: `【診断結果】PPM成熟度診断レポート${name ? ` - ${name}様` : ""}`,
        html: htmlContent,
      });

      res.status(200).json({ message: "Email sent successfully" });
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
