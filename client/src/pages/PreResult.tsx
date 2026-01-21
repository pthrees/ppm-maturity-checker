import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Building2, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { COMPANY_SIZE_OPTIONS } from "@/lib/questions";

export default function PreResult() {
  const [match, params] = useRoute("/pre-result/:id");
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"loading" | "selection">("loading");
  const [selectedSize, setSelectedSize] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setStep("selection");
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleFinish = () => {
    if (!selectedSize) return;
    localStorage.setItem(`assessment_size_${params?.id}`, selectedSize);
    setLocation(`/result/${params?.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {step === "loading" ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="text-center"
          >
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">組織の歪みを解析しています…</h2>
            <p className="text-slate-500">優先課題を特定しています。少々お待ちください。</p>
          </motion.div>
        ) : (
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg"
          >
            <Card className="p-8 shadow-xl border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">会社規模の選択</h2>
                  <p className="text-sm text-slate-500">診断精度を高めるために使用します</p>
                </div>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-8">
                <p className="text-sm text-blue-800 leading-relaxed">
                  会社規模によって“起こりやすい経営リスク”が異なります。<br />
                  あなたの会社規模を選ぶと、結果の解説がより具体的になります。
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-bold text-slate-700 mb-4 block">
                    従業員規模（目安）
                  </Label>
                  <RadioGroup
                    value={selectedSize}
                    onValueChange={setSelectedSize}
                    className="grid grid-cols-1 gap-3"
                  >
                    {COMPANY_SIZE_OPTIONS.map((option) => (
                      <div key={option.id}>
                        <RadioGroupItem
                          value={option.id}
                          id={option.id}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={option.id}
                          className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 bg-white peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-blue-50 hover:bg-slate-50 cursor-pointer transition-all"
                        >
                          <span className="font-bold text-slate-900">{option.label}</span>
                          {selectedSize === option.id && (
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          )}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <p className="text-[11px] text-slate-400 text-center">
                  ※個人情報の入力は不要です。データは統計的に処理されます。
                </p>

                <Button
                  onClick={handleFinish}
                  disabled={!selectedSize}
                  className="w-full h-14 text-lg bg-slate-900 hover:bg-slate-800"
                >
                  分析を完了する
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
