import { CategoryKey } from "@shared/schema";

export interface Question {
  id: string;
  category: CategoryKey;
  text: string;
  description: string;
}

export interface CategoryDef {
  id: CategoryKey;
  name: string;
  description: string;
}

export const CATEGORIES: Record<CategoryKey, CategoryDef> = {
  A: { id: "A", name: "稼働管理", description: "リソースの稼働状況と負荷の可視化" },
  B: { id: "B", name: "スキル・配員", description: "最適な人材配置とスキル管理" },
  C: { id: "C", name: "収益性管理", description: "プロジェクトの予実管理と採算性" },
  D: { id: "D", name: "プロセス成熟度", description: "組織的な管理プロセスとガバナンス" },
};

export const QUESTIONS: Question[] = [
  // Category A
  { 
    id: "A1", 
    category: "A", 
    text: "工数入力率", 
    description: "全メンバーが日次・週次で正確に工数を入力し、実態が把握できているか" 
  },
  { 
    id: "A2", 
    category: "A", 
    text: "予実一元把握", 
    description: "計画工数と実績工数の乖離をリアルタイムで比較・確認できる仕組みがあるか" 
  },
  { 
    id: "A3", 
    category: "A", 
    text: "PM負荷見える化", 
    description: "PM/PL層の管理負荷やオーバーワーク状況を組織として定量的に把握しているか" 
  },
  
  // Category B
  { 
    id: "B1", 
    category: "B", 
    text: "スキルアサイン", 
    description: "個人のスキルレベルに基づいた科学的なアサイン（配員）が行われているか" 
  },
  { 
    id: "B2", 
    category: "B", 
    text: "炎上防止", 
    description: "特定のリソースへの依存度やリスクを事前に検知し、炎上を未然に防ぐ手立てがあるか" 
  },
  { 
    id: "B3", 
    category: "B", 
    text: "要件定義(型)化", 
    description: "要件定義や設計のプロセスが標準化され、属人化を排除できているか" 
  },
  
  // Category C
  { 
    id: "C1", 
    category: "C", 
    text: "見積り根拠標準化", 
    description: "見積もりの前提条件や計算ロジックが組織標準として確立されているか" 
  },
  { 
    id: "C2", 
    category: "C", 
    text: "乖離要因特定", 
    description: "予実乖離が発生した際、その真因（見積もりミス、仕様変更、生産性等）を特定できているか" 
  },
  { 
    id: "C3", 
    category: "C", 
    text: "撤退基準明確化", 
    description: "赤字プロジェクトやリスク案件に対する撤退・縮小基準が明確に運用されているか" 
  },
  
  // Category D
  { 
    id: "D1", 
    category: "D", 
    text: "RAID管理標準化", 
    description: "リスク(Risk)、前提(Assumption)、課題(Issue)、依存(Dependency)の管理手法が統一されているか" 
  },
  { 
    id: "D2", 
    category: "D", 
    text: "経営ダッシュボード", 
    description: "経営層が必要とするプロジェクトポートフォリオ全体の状況が即座に可視化されているか" 
  },
  { 
    id: "D3", 
    category: "D", 
    text: "リソース調整会議", 
    description: "部門を超えたリソース調整や優先順位決定を行う会議体やプロセスが機能しているか" 
  },
];

export interface CompanySizeOption {
  id: string;
  label: string;
  range: { min: number; max: number | null };
}

export const COMPANY_SIZE_OPTIONS: CompanySizeOption[] = [
  { id: "S1", label: "個人 / 〜10名", range: { min: 1, max: 10 } },
  { id: "S2", label: "11〜30名", range: { min: 11, max: 30 } },
  { id: "S3", label: "31〜100名", range: { min: 31, max: 100 } },
  { id: "S4", label: "101〜300名", range: { min: 101, max: 300 } },
  { id: "S5", label: "301名以上", range: { min: 301, max: null } },
];
