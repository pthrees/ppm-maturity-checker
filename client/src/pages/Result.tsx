import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useAssessment } from "@/hooks/use-assessments";
import { CategoryKey } from "@shared/schema";
import { QUESTIONS, CATEGORIES, CategoryDef } from "@/lib/questions";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea, ReferenceLine, Label as RechartsLabel,
  Cell, Legend
} from "recharts";
import { Loader2, AlertTriangle, ArrowRight, CheckCircle2, AlertCircle, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { clsx } from "clsx";

// CTA content by priority category
const CTA_CONTENT: Record<CategoryKey, { leadText: string; buttonText: string }> = {
  A: {
    leadText: `生成AIで現場の効率が上がる一方で、忙しさと経営の手応えが噛み合わなくなるケースが増えています。
工数管理は、現場管理ではなく経営判断のための情報になりつつあります。
「AI時代を生き抜く処方箋」として、工数管理のポイントを整理した１ペーパースライドをご用意しましたので、視点整理にご活用ください。`,
    buttonText: "生成AI時代の「次世代」工数管理ガイドラインを受け取る"
  },
  B: {
    leadText: `生成AI時代では、人数や稼働量よりも「人とスキルをどのように組み合わせるか」が成果を左右します。
リソース管理は、人事の話ではなく経営リスクの話になっています。
「AI時代を生き抜く処方箋」として、スキル＆リソース管理のポイントを整理した１ペーパースライドをご用意しましたので、視点整理にご活用ください。`,
    buttonText: "生成AI時代の「脱・属人化」のロードマップを受け取る"
  },
  C: {
    leadText: `生成AIで生産性が上がるほど、受託ビジネスでは「どこで利益が生まれているか」が見えにくくなります。
特に収益管理は、努力や稼働量ではなく、経営判断そのものが問われる領域です。
「AI時代を生き抜く処方箋」として、収益管理のポイントを整理した１ペーパースライドをご用意しましたので、視点整理にご活用ください。`,
    buttonText: "生成AI時代対応版「収益管理」ガイドラインを受け取る"
  },
  D: {
    leadText: `生成AIで個別案件は回っていても、全体としての意思決定が重くなる企業が増えています。
PPM成熟度は、管理レベルではなく経営の可視性の問題です。
「AI時代を生き抜く処方箋」として、PPMと経営変革のロードマップについて整理した１ペーパースライドをご用意しましたので、視点整理にご活用ください。`,
    buttonText: "生成AI時代の「経営管理変革」ロードマップを受け取る"
  }
};

// --- Logic Helpers ---

// Calculate risk score: (3 - Maturity) * Importance
function calculateRisk(maturity: number, importance: number) {
  return (3 - maturity) * importance;
}

// Group data by category and calculate aggregates
function analyzeAssessment(answers: Record<string, { maturity: number, importance: number }>) {
  const categoryScores: Record<CategoryKey, { riskSum: number, importanceSum: number, maturitySum: number, count: number }> = {
    A: { riskSum: 0, importanceSum: 0, maturitySum: 0, count: 0 },
    B: { riskSum: 0, importanceSum: 0, maturitySum: 0, count: 0 },
    C: { riskSum: 0, importanceSum: 0, maturitySum: 0, count: 0 },
    D: { riskSum: 0, importanceSum: 0, maturitySum: 0, count: 0 },
  };

  const scatterData: any[] = [];

  QUESTIONS.forEach(q => {
    const ans = answers[q.id];
    if (!ans) return;

    // Accumulate category stats
    const stats = categoryScores[q.category];
    stats.riskSum += calculateRisk(ans.maturity, ans.importance);
    stats.importanceSum += ans.importance;
    stats.maturitySum += ans.maturity;
    stats.count += 1;
  });

  // Calculate averages and max risk category
  let maxRisk = -1;
  let priorityCategory: CategoryKey = 'A'; // Default

  // Prepare Chart Data
  const radarData = Object.entries(categoryScores).map(([key, stats]) => {
    const k = key as CategoryKey;
    const avgMaturity = stats.maturitySum / stats.count;
    const avgImportance = stats.importanceSum / stats.count;
    
    // Determine priority (Max Risk)
    if (stats.riskSum > maxRisk) {
      maxRisk = stats.riskSum;
      priorityCategory = k;
    } else if (stats.riskSum === maxRisk) {
      // Tie-breaker logic: High Importance Avg -> Low Maturity Avg
      const currentPriorityStats = categoryScores[priorityCategory];
      const currentAvgImp = currentPriorityStats.importanceSum / currentPriorityStats.count;
      
      if (avgImportance > currentAvgImp) {
        priorityCategory = k;
      } else if (avgImportance === currentAvgImp) {
        const currentAvgMat = currentPriorityStats.maturitySum / currentPriorityStats.count;
        if (avgMaturity < currentAvgMat) {
          priorityCategory = k;
        }
      }
    }

    // Scatter plot data point (Category average)
    scatterData.push({
      id: k,
      name: (CATEGORIES as any)[k].name,
      x: parseFloat(avgMaturity.toFixed(2)),
      y: parseFloat(avgImportance.toFixed(2)),
      z: 1, // Size
    });

    return {
      category: (CATEGORIES as any)[k].name,
      current: parseFloat(avgMaturity.toFixed(2)),
      ideal: 3, // Always 3
      fullMark: 3,
    };
  });

  return { priorityCategory, radarData, scatterData, categoryScores };
}

// Feedback text generator based on priority category
function getFeedback(category: CategoryKey, sizeId?: string | null) {
  const sizePrefixes: Record<string, string> = {
    S1: "（〜10名規模では）",
    S2: "（11〜30名規模では）",
    S3: "（31〜100名規模では）",
    S4: "（101〜300名規模では）",
    S5: "（301名以上の規模では）",
  };

  const pitfallTexts: Record<string, string> = {
    S1: "属人化と兼務が前提になり、問題が見えないまま拡大しやすい傾向にあります。仕組み化が遅れるほど、後からの標準化コストが増えるため注意が必要です。",
    S2: "案件と人の増加で、PM/PLの“見えない負荷”が急増しやすい時期です。体制の当たり外れが収益性を左右しやすいのがこの規模の特徴です。",
    S3: "部分最適が進み、全体の予実・稼働・品質がつながらなくなるフェーズです。炎上が“再現性をもって”起こり始めるため、組織的な対策が求められます。",
    S4: "標準化不足がボトルネックになり、管理が破綻しやすい規模です。撤退判断の遅れが不採算を固定化しやすいため、明確な基準運用が不可欠です。",
    S5: "意思決定とガバナンスが重くなり、現場の改善が進みにくい状況に陥りがちです。全社最適のリソース調整が難しく、投資判断が遅れるリスクが高まります。",
  };

  const categorySpecificOneLiner: Record<CategoryKey, string> = {
    A: "負荷が見えない状態が続くと、離職と炎上が同時進行しやすくなります。",
    B: "ミスマッチは品質だけでなく、ブランド毀損として回収不能な損失になり得ます。",
    C: "不採算の“見逃し”が積み上がると、投資余力が消え、成長が止まります。",
    D: "意思決定の遅れは、ガバナンスリスクとして後から大きなコストになります。",
  };

  const prefix = sizeId ? sizePrefixes[sizeId] : "";
  const oneLiner = categorySpecificOneLiner[category];
  const pitfall = sizeId ? pitfallTexts[sizeId] : "";

  switch(category) {
    case 'A':
      return {
        title: "「稼働の見える化」が最優先課題です",
        text: `${prefix}プロジェクト現場の状況が見えていないため、トラブルの予兆を掴めず、後手対応になりがちです。${oneLiner}まずは正確な工数入力の定着と、予実乖離のモニタリングから始めましょう。`,
        actions: ["日次での工数入力を徹底する", "プロジェクト別の予実状況を週次で確認する会議を設ける"],
        pitfall
      };
    case 'B':
      return {
        title: "「リソース配分の最適化」が急務です",
        text: `${prefix}特定のエース社員への依存や、スキルミスマッチによる生産性低下のリスクが高い状態です。${oneLiner}スキルマップを整備し、脱属人化・標準化を進める必要があります。`,
        actions: ["主要メンバーのスキルマップを作成する", "要件定義や設計の標準ドキュメント（型）を整備する"],
        pitfall
      };
    case 'C':
      return {
        title: "「収益管理の厳格化」が必要です",
        text: `${prefix}どんぶり勘定での受注や、赤字プロジェクトの垂れ流しが発生しやすい体質です。${oneLiner}見積もりの根拠を明確にし、撤退基準などのガバナンスを強化しましょう。`,
        actions: ["見積もりの承認プロセスに基準を設ける", "赤字プロジェクトの撤退・縮小基準を明文化する"],
        pitfall
      };
    case 'D':
      return {
        title: "「組織プロセスの標準化」を目指しましょう",
        text: `${prefix}場当たり的な対応が多く、組織としての学習効果が蓄積されていません。${oneLiner}仕組み作りが必要です。`,
        actions: ["PMO（またはそれに準ずる機能）を立ち上げる", "全プロジェクトの状況を俯瞰する経営ダッシュボードを構築する"],
        pitfall
      };
  }
}

export default function Result() {
  const [match, params] = useRoute("/result/:id");
  const { data: assessment, isLoading, error } = useAssessment(params?.id ? parseInt(params.id) : null);
  const { toast } = useToast();
  
  // State for email dialog
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSendEmail = async () => {
    if (!email) return;
    setIsSending(true);
    try {
      // Send structured data instead of raw HTML for better email compatibility
      const resultUrl = window.location.href;
      
      await apiRequest("POST", "/api/send-report", {
        email,
        name,
        assessmentId: params?.id,
        resultUrl,
        reportData: {
          userName: (assessment?.userInfo as any)?.name || "未入力",
          companyName: (assessment?.userInfo as any)?.companyName || "",
          diagnosisDate: assessment?.createdAt ? new Date(assessment.createdAt).toLocaleDateString('ja-JP') : new Date().toLocaleDateString('ja-JP'),
          priorityTitle: feedback.title,
          priorityText: feedback.text,
          pitfall: feedback.pitfall,
          actions: feedback.actions,
          priorityCategory: priorityCategory,
          categoryScores: radarData.map((row, idx) => ({
            name: row.category,
            maturity: row.current.toFixed(1),
            importance: scatterData[idx].y.toFixed(1),
            riskScore: ((3 - row.current) * scatterData[idx].y).toFixed(1),
            status: row.current < 1.5 && scatterData[idx].y > 2 ? '危険' : row.current < 2 ? '注意' : '良好'
          }))
        }
      });
      
      toast({
        title: "送信完了",
        description: "診断レポートをメールで送信しました。",
      });
      setIsDialogOpen(false);
    } catch (err) {
      toast({
        title: "送信エラー",
        description: "メールの送信に失敗しました。時間をおいて再度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-slate-500 font-medium">診断結果を分析中...</p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md px-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">データが見つかりません</h2>
          <p className="text-slate-500 mb-6">診断IDが無効か、データが削除された可能性があります。</p>
          <Button onClick={() => window.location.href = "/"}>トップへ戻る</Button>
        </div>
      </div>
    );
  }

  // --- Analysis ---
  const sizeId = params?.id ? localStorage.getItem(`assessment_size_${params.id}`) : null;
  const answers = assessment.answers as Record<string, { maturity: number, importance: number }>;
  const { priorityCategory, radarData, scatterData } = analyzeAssessment(answers);
  const feedback = getFeedback(priorityCategory, sizeId);

  // Category colors for chart
  const categoryColors: Record<CategoryKey, string> = {
    A: "#3b82f6", // Blue
    B: "#10b981", // Green
    C: "#f59e0b", // Amber
    D: "#8b5cf6", // Violet
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast({
      title: "URLをコピーしました",
      description: "チームメンバーに共有しましょう。",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 print:bg-white print:pb-0">
      {/* Header - No print */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="font-display font-bold text-xl text-slate-900">
              P3 <span className="text-primary">PPM</span> Maturity Checker
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm" data-testid="button-header-email">
                  <Mail className="w-4 h-4 mr-2" />
                  結果を転送
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>診断レポートの転送</DialogTitle>
                  <DialogDescription>
                    診断結果をメールで送信します。
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">メールアドレス（必須）</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                      ご入力いただいたメールアドレスは、診断結果の送付および、当社サービス・事例に関するご案内 に利用させていただく場合があります。ご案内が不要な場合は、配信停止の手続きをいつでも行えます。
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    type="submit" 
                    onClick={handleSendEmail} 
                    disabled={isSending || !email}
                    className="w-full"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        送信中...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        メールを送信する
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* User Info & Date */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">
              {(assessment.userInfo as any)?.name || "未入力"}さん
            </h1>
            <p className="text-slate-500">
              診断日: {new Date(assessment.createdAt!).toLocaleDateString('ja-JP')}
            </p>
          </div>
          <div className="text-right mt-4 sm:mt-0">
             <div className="text-sm text-slate-500">総合リスクレベル</div>
             <div className="text-2xl font-bold text-amber-600">要改善</div>
          </div>
        </div>

        {/* Priority Card - Most Important */}
        <Card className="p-8 bg-gradient-to-br from-white to-blue-50 border-l-4 border-l-primary shadow-lg print-shadow-none">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
               <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                 <AlertTriangle className="w-8 h-8" />
               </div>
            </div>
            <div>
              <div className="text-sm font-bold text-primary tracking-wider uppercase mb-1">Priority Action</div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">{feedback.title}</h2>
              <p className="text-slate-700 leading-relaxed mb-6">
                {feedback.text}
              </p>
              
              <div className="bg-white/60 rounded-xl p-4 border border-blue-100 mb-4">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  この規模で起こりやすい落とし穴
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {feedback.pitfall}
                </p>
              </div>

              <div className="bg-white/60 rounded-xl p-4 border border-blue-100">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  推奨アクション
                </h3>
                <ul className="space-y-2">
                  {feedback.actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-blue-400" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* CTA Section - Dynamic based on priority category */}
        <Card className="p-8 bg-gradient-to-br from-slate-50 to-white border border-slate-200 shadow-lg print-shadow-none">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-6">
              <p className="text-slate-700 leading-relaxed whitespace-pre-line text-left md:text-center" data-testid="text-cta-lead">
                {CTA_CONTENT[priorityCategory].leadText}
              </p>
            </div>
            <Button 
              size="lg"
              onClick={() => setIsDialogOpen(true)}
              data-testid="button-cta-download"
              className="bg-emerald-500 text-white text-2xl font-bold shadow-[0_6px_0_0_#059669] hover:shadow-[0_4px_0_0_#059669] hover:translate-y-[2px] active:shadow-[0_0_0_0_#059669] active:translate-y-[6px] transition-all"
            >
              <Mail className="w-6 h-6 mr-3" />
              {CTA_CONTENT[priorityCategory].buttonText}
            </Button>
            <p className="text-xs text-slate-400 mt-4">
              ※メールアドレスをご入力いただくと、PDFをお送りします
            </p>
          </div>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8 print-break-inside-avoid">
          {/* Scatter Chart (Matrix) */}
          <Card className="p-6 shadow-md print-shadow-none flex flex-col items-center">
            <div className="w-full mb-4">
               <h3 className="text-lg font-bold text-slate-900">ポートフォリオ分析 (重要度 × 成熟度)</h3>
               <p className="text-xs text-slate-500">右上にいくほど健全。左上（重要度高・成熟度低）が優先改善領域。</p>
            </div>
            <div className="w-full h-[380px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="成熟度" 
                    domain={[0, 3]} 
                    tickCount={4}
                    label={{ value: '成熟度 (Maturity)', position: 'bottom', offset: 20 }} 
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="重要度" 
                    domain={[0, 3]} 
                    tickCount={4}
                    label={{ value: '重要度 (Importance)', angle: -90, position: 'insideLeft', offset: 0 }} 
                  />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Legend verticalAlign="top" height={36}/>
                  
                  {/* Danger Zone: High Importance (1.5-3), Low Maturity (0-1.5) */}
                  <ReferenceArea x1={0} x2={1.5} y1={1.5} y2={3} fill="rgba(255, 0, 0, 0.05)" stroke="none" />
                  
                  {scatterData.map((entry, index) => (
                    <Scatter 
                      key={entry.id} 
                      name={entry.name} 
                      data={[entry]} 
                      fill={categoryColors[entry.id as CategoryKey]} 
                    />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
              {/* Labels for quadrants - absolutely positioned for better control */}
              <div className="absolute top-16 left-12 text-[10px] font-bold text-red-500 bg-white/80 px-1 border border-red-100 rounded">優先改善</div>
              <div className="absolute top-16 right-4 text-[10px] font-bold text-green-600 bg-white/80 px-1 border border-green-100 rounded">重点維持</div>
            </div>
          </Card>

          {/* Radar Chart */}
          <Card className="p-6 shadow-md print-shadow-none flex flex-col items-center">
             <div className="w-full mb-4">
               <h3 className="text-lg font-bold text-slate-900">カテゴリー別成熟度比較</h3>
               <p className="text-xs text-slate-500">青：現状 / グレー：理想(3.0)</p>
            </div>
            <div className="w-full h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 3]} tickCount={4} />
                  <Radar
                    name="理想"
                    dataKey="ideal"
                    stroke="#cbd5e1"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fill="transparent"
                  />
                  <Radar
                    name="現状"
                    dataKey="current"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Detailed Table */}
        <div className="mt-12 print-break-inside-avoid">
           <h3 className="text-xl font-bold text-slate-900 mb-6">詳細スコア内訳</h3>
           <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
             <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                 <tr>
                   <th className="px-6 py-4">カテゴリー</th>
                   <th className="px-6 py-4 text-center">成熟度 (Avg)</th>
                   <th className="px-6 py-4 text-center">重要度 (Avg)</th>
                   <th className="px-6 py-4 text-center">リスクスコア</th>
                   <th className="px-6 py-4">判定</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {radarData.map((row, idx) => {
                    const riskLevel = row.current < 1.5 && scatterData[idx].y > 2 ? '危険' : row.current < 2 ? '注意' : '良好';
                    const riskColor = riskLevel === '危険' ? 'text-red-600 bg-red-50' : riskLevel === '注意' ? 'text-amber-600 bg-amber-50' : 'text-green-600 bg-green-50';
                    
                    return (
                     <tr key={idx} className="hover:bg-slate-50/50">
                       <td className="px-6 py-4 font-medium text-slate-900">{row.category}</td>
                       <td className="px-6 py-4 text-center font-mono">{row.current.toFixed(1)} / 3.0</td>
                       <td className="px-6 py-4 text-center font-mono">{scatterData[idx].y.toFixed(1)} / 3.0</td>
                       <td className="px-6 py-4 text-center font-mono text-slate-500">
                         {((3 - row.current) * scatterData[idx].y).toFixed(1)}
                       </td>
                       <td className="px-6 py-4">
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${riskColor}`}>
                           {riskLevel}
                         </span>
                       </td>
                     </tr>
                    );
                 })}
               </tbody>
             </table>
           </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-8 border-t border-slate-200">
        <div className="flex justify-center">
          <a 
            href="https://www.canva.com/design/DAG72NAUfvg/ZJ_0WGacW76NZiKyHrKKOQ/view?utm_content=DAG72NAUfvg&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h34a2f7e6c0" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-slate-500 hover:text-primary transition-colors underline underline-offset-4"
          >
            プライバシー・ポリシー
          </a>
        </div>
      </footer>
    </div>
  );
}
