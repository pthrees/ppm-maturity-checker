import { assessments, type InsertAssessment, type Assessment } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { getResendClient } from "./resend";
import fs from "fs";
import path from "path";

const WHITEPAPER_MAP: Record<string, { filename: string; displayName: string }> = {
  "A": { filename: "category-A.pdf", displayName: "PPM白書_工数管理.pdf" },
  "B": { filename: "category-B.pdf", displayName: "PPM白書_リソース管理.pdf" },
  "C": { filename: "category-C.pdf", displayName: "PPM白書_収益管理.pdf" },
  "D": { filename: "category-D.pdf", displayName: "PPM白書_経営管理.pdf" },
};

const EMAIL_LEAD_TEXT: Record<string, string> = {
  "A": `生成AIで現場の効率が上がる一方で、忙しさと経営の手応えが噛み合わなくなるケースが増えています。
工数管理は、現場管理ではなく経営判断のための情報になりつつあります。
「AI時代を生き抜く処方箋」として、工数管理のポイントを整理したスライドを添付致します。
視点整理にご活用ください。`,
  "B": `生成AI時代では、人数や稼働量よりも「人とスキルをどのように組み合わせるか」が成果を左右します。
リソース管理は、人事の話ではなく経営リスクの話になっています。
「AI時代を生き抜く処方箋」として、スキル＆リソース管理のポイントを整理したスライドを添付致します。
視点整理にご活用ください。`,
  "C": `生成AIで生産性が上がるほど、受託ビジネスでは「どこで利益が生まれているか」が見えにくくなります。
特に収益管理は、努力や稼働量ではなく、経営判断そのものが問われる領域です。
「AI時代を生き抜く処方箋」として、収益管理のポイントを整理したスライドを添付致します。
視点整理にご活用ください。`,
  "D": `生成AIで個別案件は回っていても、全体としての意思決定が重くなる企業が増えています。
PPM成熟度は、管理レベルではなく経営の可視性の問題です。
「AI時代を生き抜く処方箋」として、PPMと経営変革のロードマップについて整理したスライドを添付致します。
視点整理にご活用ください。`,
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Email sending endpoint
  app.post("/api/send-report", async (req, res) => {
    try {
      const { email, name, assessmentId, resultUrl, reportData } = req.body;
      
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

      // Build a clean, email-compatible HTML template
      const htmlContent = buildEmailTemplate(name, resultUrl, reportData);

      try {
        const { client } = await getResendClient();
        
        // Determine priority category and prepare PDF attachment
        const priorityCategory = reportData?.priorityCategory as string | undefined;
        const attachments: Array<{ filename: string; content: Buffer }> = [];
        
        if (priorityCategory && WHITEPAPER_MAP[priorityCategory]) {
          const whitepaperInfo = WHITEPAPER_MAP[priorityCategory];
          const pdfPath = path.join(process.cwd(), "server", "whitepapers", whitepaperInfo.filename);
          
          if (fs.existsSync(pdfPath)) {
            const pdfBuffer = fs.readFileSync(pdfPath);
            attachments.push({
              filename: whitepaperInfo.displayName,
              content: pdfBuffer,
            });
          }
        }
        
        await client.emails.send({
          from: "P3 PPM Maturity Checker <hello@pthree.app>",
          to: email,
          subject: `【診断結果】P3 PPM Maturity Checker レポート${name ? ` - ${name}様` : ""}`,
          html: htmlContent,
          attachments: attachments.length > 0 ? attachments : undefined,
        });

        return res.status(200).json({ message: "Email sent successfully" });
      } catch (resendError) {
        console.error("Resend error:", resendError);
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

  // Build email-compatible HTML template (no SVG, no complex CSS)
  function buildEmailTemplate(name: string, resultUrl: string, data: any) {
    const statusColors: Record<string, string> = {
      '危険': '#dc2626',
      '注意': '#d97706',
      '良好': '#16a34a'
    };

    const categoryRows = data.categoryScores?.map((cat: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${cat.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-family: monospace;">${cat.maturity} / 3.0</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-family: monospace;">${cat.importance} / 3.0</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-family: monospace;">${cat.riskScore}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; background-color: ${statusColors[cat.status] || '#6b7280'}20; color: ${statusColors[cat.status] || '#6b7280'};">${cat.status}</span>
        </td>
      </tr>
    `).join('') || '';

    const actionItems = data.actions?.map((action: string) => `
      <li style="margin-bottom: 8px; padding-left: 8px;">
        <span style="color: #3b82f6; margin-right: 8px;">→</span>${action}
      </li>
    `).join('') || '';

    return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif; background-color: #f8fafc; color: #1e293b;">
  <div style="max-width: 640px; margin: 0 auto; padding: 32px 16px;">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="font-size: 24px; font-weight: bold; margin: 0; color: #0f172a;">
        P3 <span style="color: #3b82f6;">PPM</span> Maturity Checker
      </h1>
      <p style="color: #64748b; margin-top: 8px; font-size: 14px;">診断結果レポート</p>
    </div>

    <!-- Main Card -->
    <div style="background-color: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      
      <!-- User Info -->
      <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 24px;">
        <h2 style="font-size: 20px; margin: 0 0 12px 0;">${data.userName}さん</h2>
        ${data.priorityCategory && EMAIL_LEAD_TEXT[data.priorityCategory] ? `
        <p style="color: #475569; line-height: 1.8; margin: 0 0 12px 0; font-size: 14px; white-space: pre-line;">${EMAIL_LEAD_TEXT[data.priorityCategory]}</p>
        ` : ''}
        ${data.companyName ? `<p style="color: #64748b; margin: 0 0 4px 0; font-size: 14px;">${data.companyName}</p>` : ''}
        <p style="color: #64748b; margin: 0; font-size: 14px;">診断日: ${data.diagnosisDate}</p>
      </div>

      <!-- Priority Action -->
      <div style="background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%); border-left: 4px solid #3b82f6; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
        <p style="color: #3b82f6; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Priority Action</p>
        <h3 style="font-size: 18px; font-weight: bold; margin: 0 0 12px 0; color: #0f172a;">${data.priorityTitle}</h3>
        <p style="color: #475569; line-height: 1.6; margin: 0;">${data.priorityText}</p>
      </div>

      ${data.pitfall ? `
      <!-- Pitfall -->
      <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="font-size: 14px; font-weight: bold; margin: 0 0 8px 0; color: #92400e;">
          ⚠️ この規模で起こりやすい落とし穴
        </p>
        <p style="color: #78350f; font-size: 14px; line-height: 1.5; margin: 0;">${data.pitfall}</p>
      </div>
      ` : ''}

      <!-- Recommended Actions -->
      <div style="background-color: #f0fdf4; border: 1px solid #dcfce7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="font-size: 14px; font-weight: bold; margin: 0 0 12px 0; color: #166534;">
          ✓ 推奨アクション
        </p>
        <ul style="margin: 0; padding-left: 16px; color: #15803d; font-size: 14px; line-height: 1.6;">
          ${actionItems}
        </ul>
      </div>

      <!-- Score Table -->
      <div style="margin-bottom: 24px;">
        <h4 style="font-size: 16px; font-weight: bold; margin: 0 0 16px 0;">詳細スコア内訳</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background-color: #f8fafc;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #64748b; font-weight: 500;">カテゴリー</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb; color: #64748b; font-weight: 500;">成熟度</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb; color: #64748b; font-weight: 500;">重要度</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb; color: #64748b; font-weight: 500;">リスク</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #64748b; font-weight: 500;">判定</th>
            </tr>
          </thead>
          <tbody>
            ${categoryRows}
          </tbody>
        </table>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <p style="color: #64748b; font-size: 14px; margin: 0 0 16px 0;">
          グラフを含む詳細な診断結果はWebでご確認いただけます
        </p>
        <a href="${resultUrl.replace(/^https?:\/\/[^\/]+/, 'https://checker.pthree.app')}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 500; font-size: 14px;">
          詳細を見る →
        </a>
      </div>

    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px; color: #94a3b8; font-size: 12px;">
      <p style="margin: 0;">P3 PPM Maturity Checker</p>
      <p style="margin: 4px 0 0 0;">© 2024 PPM Diagnosis Tool. All rights reserved.</p>
    </div>

  </div>
</body>
</html>
    `;
  }

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
