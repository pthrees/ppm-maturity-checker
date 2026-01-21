import { useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useAssessment } from "@/hooks/use-assessments";
import { QUESTIONS, CATEGORIES, CategoryKey, Question } from "@/lib/questions";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea, ReferenceLine, Label as RechartsLabel
} from "recharts";
import { Loader2, Share2, Printer, AlertTriangle, ArrowRight, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { clsx } from "clsx";

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
      name: CATEGORIES[k].name,
      x: parseFloat(avgMaturity.toFixed(2)),
      y: parseFloat(avgImportance.toFixed(2)),
      z: 1, // Size
    });

    return {
      category: CATEGORIES[k].name,
      current: parseFloat(avgMaturity.toFixed(2)),
      ideal: 3, // Always 3
      fullMark: 3,
    };
  });

  return { priorityCategory, radarData, scatterData, categoryScores };
}

// Feedback text generator based on priority category
function getFeedback(category: CategoryKey) {
  switch(category) {
    case 'A':
      return {
        title: "「稼働の見える化」が最優先課題です",
        text: "プロジェクト現場の状況が見えていないため、トラブルの予兆を掴めず、後手対応になりがちです。まずは正確な工数入力の定着と、予実乖離のモニタリングから始めましょう。",
        actions: ["日次での工数入力を徹底する", "プロジェクト別の予実状況を週次で確認する会議を設ける"]
      };
    case 'B':
      return {
        title: "「リソース配分の最適化」が急務です",
        text: "特定のエース社員への依存や、スキルミスマッチによる生産性低下のリスクが高い状態です。スキルマップを整備し、脱属人化・標準化を進める必要があります。",
        actions: ["主要メンバーのスキルマップを作成する", "要件定義や設計の標準ドキュメント（型）を整備する"]
      };
    case 'C':
      return {
        title: "「収益管理の厳格化」が必要です",
        text: "どんぶり勘定での受注や、赤字プロジェクトの垂れ流しが発生しやすい体質です。見積もりの根拠を明確にし、撤退基準などのガバナンスを強化しましょう。",
        actions: ["見積もりの承認プロセスに基準を設ける", "赤字プロジェクトの撤退・縮小基準を明文化する"]
      };
    case 'D':
      return {
        title: "「組織プロセスの標準化」を目指しましょう",
        text: "場当たり的な対応が多く、組織としての学習効果が蓄積されていません。PMO機能の強化や、経営層へのレポーティングラインの整備など、仕組み作りが必要です。",
        actions: ["PMO（またはそれに準ずる機能）を立ち上げる", "全プロジェクトの状況を俯瞰する経営ダッシュボードを構築する"]
      };
  }
}

export default function Result() {
  const [match, params] = useRoute("/result/:id");
  const { data: assessment, isLoading, error } = useAssessment(params?.id ? parseInt(params.id) : null);
  const { toast } = useToast();
  
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
  const answers = assessment.answers as Record<string, { maturity: number, importance: number }>;
  const { priorityCategory, radarData, scatterData } = analyzeAssessment(answers);
  const feedback = getFeedback(priorityCategory);

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
          <div className="font-display font-bold text-xl text-slate-900">
            診断結果レポート
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              共有
            </Button>
            <Button variant="default" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              PDF/印刷
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* User Info & Date */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">
              {(assessment.userInfo as any)?.companyName || "未設定"} 様
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

        <div className="grid lg:grid-cols-2 gap-8 print-break-inside-avoid">
          {/* Scatter Chart (Matrix) */}
          <Card className="p-6 shadow-md print-shadow-none flex flex-col items-center">
            <div className="w-full mb-4">
               <h3 className="text-lg font-bold text-slate-900">ポートフォリオ分析 (重要度 × 成熟度)</h3>
               <p className="text-xs text-slate-500">右上にいくほど健全。左上（重要度高・成熟度低）が危険領域。</p>
            </div>
            <div className="w-full h-[350px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="成熟度" 
                    domain={[0, 3]} 
                    tickCount={4}
                    label={{ value: '成熟度 (Maturity)', position: 'bottom', offset: 0 }} 
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="重要度" 
                    domain={[0, 3]} 
                    tickCount={4}
                    label={{ value: '重要度 (Importance)', angle: -90, position: 'left' }} 
                  />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  
                  {/* Danger Zone: High Importance (1.5-3), Low Maturity (0-1.5) */}
                  <ReferenceArea x1={0} x2={1.5} y1={1.5} y2={3} fill="rgba(255, 0, 0, 0.05)" stroke="none" />
                  
                  <Scatter name="Categories" data={scatterData} fill="#3b82f6" shape="circle">
                    {scatterData.map((entry, index) => (
                       <cell key={`cell-${index}`} fill={entry.id === priorityCategory ? '#ef4444' : '#3b82f6'} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              {/* Labels for quadrants - absolutely positioned for better control */}
              <div className="absolute top-4 left-12 text-xs font-bold text-red-500 bg-white/80 px-1">優先改善領域</div>
              <div className="absolute top-4 right-4 text-xs font-bold text-green-600 bg-white/80 px-1">重点維持領域</div>
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
    </div>
  );
}
