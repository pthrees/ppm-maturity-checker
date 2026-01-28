import { Link } from "wouter";
import { ArrowRight, BarChart2, TrendingUp, Target } from "lucide-react";
import AssessmentForm from "@/components/AssessmentForm";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <BarChart2 className="w-6 h-6 text-primary" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-slate-900">
              P3 <span className="text-primary">PPM</span> Maturity Checker
            </span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-primary transition-colors">特徴</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-sm font-medium text-slate-600 mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            プロジェクト管理成熟度診断
          </div>
          
          <h1 className="text-5xl md:text-6xl font-display font-bold text-slate-900 mb-6 tracking-tight leading-tight animate-fade-in [animation-delay:100ms]">
            組織の<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">PPM成熟度</span>と<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">経営インパクト</span>を可視化
          </h1>
          
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12 animate-fade-in [animation-delay:200ms]">
            わずか3分、12問の質問に答えるだけで、あなたの組織のプロジェクト管理の課題と優先すべきアクションプランを診断します。
          </p>
        </div>

        {/* The Form Component */}
        <div className="relative z-10 animate-fade-in [animation-delay:300ms]">
          <AssessmentForm />
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">現状の客観的評価</h3>
              <p className="text-slate-600 leading-relaxed">
                4つの主要カテゴリー（稼働、スキル、収益性、プロセス）に基づき、組織の現在地を定量的に評価します。
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">リスクの可視化</h3>
              <p className="text-slate-600 leading-relaxed">
                「重要度が高いのに成熟度が低い」領域を特定。経営リスクに直結する課題を浮き彫りにします。
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                <ArrowRight className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">具体的アクション</h3>
              <p className="text-slate-600 leading-relaxed">
                診断結果に基づき、次に取るべき具体的な改善アクションを自動提案。迷わず改善に着手できます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5" />
            <span className="font-bold text-white text-sm">P3 <span className="text-primary">PPM</span> Maturity Checker</span>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <a 
              href="https://www.canva.com/design/DAG72NAUfvg/ZJ_0WGacW76NZiKyHrKKOQ/view?utm_content=DAG72NAUfvg&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h34a2f7e6c0" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs hover:text-white transition-colors underline underline-offset-4"
            >
              プライバシー・ポリシー
            </a>
            <p className="text-xs">© 2026 P3 Strategic Partners Co., Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
