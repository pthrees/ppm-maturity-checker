import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Check, AlertCircle } from "lucide-react";
import { createAssessmentRequestSchema } from "@shared/schema";
import { QUESTIONS, CATEGORIES } from "@/lib/questions";
import { useCreateAssessment } from "@/hooks/use-assessments";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Extended schema to handle the form state better
const formSchema = createAssessmentRequestSchema;
type FormValues = z.infer<typeof formSchema>;

export default function AssessmentForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const createAssessment = useCreateAssessment();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      answers: {},
      userInfo: { companyName: "", role: "" }
    },
    mode: "onChange"
  });

  const currentQuestion = QUESTIONS[currentStep];
  const isLastStep = currentStep === QUESTIONS.length;
  const progress = ((currentStep) / QUESTIONS.length) * 100;

  const handleNext = async () => {
    const qId = currentQuestion.id;
    const currentAnswer = form.getValues(`answers.${qId}`);
    
    // Basic validation for current step
    if (currentAnswer?.maturity === undefined || currentAnswer?.importance === undefined) {
      toast({
        title: "未入力の項目があります",
        description: "成熟度と重要度の両方を選択してください。",
        variant: "destructive",
      });
      return;
    }
    
    setCurrentStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const result = await createAssessment.mutateAsync(data);
      toast({
        title: "診断完了",
        description: "結果ページへ移動します...",
      });
      setLocation(`/result/${result.id}`);
    } catch (error) {
      toast({
        title: "エラーが発生しました",
        description: "もう一度お試しください。",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm font-medium text-muted-foreground mb-2">
          <span>進捗状況</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative min-h-[500px]">
        <form onSubmit={form.handleSubmit(onSubmit)} className="h-full">
          <AnimatePresence mode="wait">
            {!isLastStep ? (
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-8 md:p-12"
              >
                {/* Category Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-wider mb-6">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  カテゴリー {currentQuestion.category}: {CATEGORIES[currentQuestion.category].name}
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 font-display">
                  Q{currentStep + 1}. {currentQuestion.text}
                </h2>
                <p className="text-slate-600 text-lg mb-12 leading-relaxed">
                  {currentQuestion.description}
                </p>

                <div className="grid md:grid-cols-2 gap-12">
                  {/* Maturity Input */}
                  <div className="space-y-6">
                    <div className="flex justify-between items-end mb-2">
                      <Label className="text-base font-bold text-slate-800">
                        現在の成熟度
                      </Label>
                      <span className="text-2xl font-bold text-primary">
                        {form.watch(`answers.${currentQuestion.id}.maturity`) ?? "-"}
                        <span className="text-sm text-muted-foreground font-normal ml-1">/ 3</span>
                      </span>
                    </div>
                    
                    <div className="pt-2 pb-6 px-1">
                      <Slider
                        defaultValue={[0]}
                        min={0}
                        max={3}
                        step={1}
                        value={[form.watch(`answers.${currentQuestion.id}.maturity`) ?? 0]}
                        onValueChange={(vals) => form.setValue(`answers.${currentQuestion.id}.maturity`, vals[0])}
                        className="cursor-pointer py-4"
                      />
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground font-medium">
                        <span>0: 未実施</span>
                        <span>1: 一部実施</span>
                        <span>2: 標準化済</span>
                        <span>3: 最適化</span>
                      </div>
                    </div>
                  </div>

                  {/* Importance Input */}
                  <div className="space-y-6">
                    <div className="flex justify-between items-end mb-2">
                      <Label className="text-base font-bold text-slate-800">
                        経営上の重要度
                      </Label>
                      <span className="text-2xl font-bold text-amber-600">
                        {form.watch(`answers.${currentQuestion.id}.importance`) ?? "-"}
                        <span className="text-sm text-muted-foreground font-normal ml-1">/ 3</span>
                      </span>
                    </div>

                    <RadioGroup 
                      onValueChange={(val) => form.setValue(`answers.${currentQuestion.id}.importance`, parseInt(val))}
                      value={form.watch(`answers.${currentQuestion.id}.importance`)?.toString()}
                      className="grid grid-cols-3 gap-3"
                    >
                      {[1, 2, 3].map((val) => (
                        <div key={val}>
                          <RadioGroupItem value={val.toString()} id={`imp-${val}`} className="peer sr-only" />
                          <Label
                            htmlFor={`imp-${val}`}
                            className="flex flex-col items-center justify-center h-24 rounded-xl border-2 border-slate-100 bg-slate-50 peer-data-[state=checked]:border-amber-500 peer-data-[state=checked]:bg-amber-50 hover:bg-white hover:border-slate-200 cursor-pointer transition-all"
                          >
                            <span className="text-xl font-bold mb-1">{val}</span>
                            <span className="text-xs text-center text-muted-foreground px-1">
                              {val === 1 ? "低" : val === 2 ? "中" : "高"}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="summary"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 md:p-12 flex flex-col h-full"
              >
                 <div className="text-center mb-8">
                   <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Check className="w-8 h-8" />
                   </div>
                   <h2 className="text-2xl font-bold text-slate-900">回答完了！</h2>
                   <p className="text-slate-500 mt-2">最後に属性情報を入力して診断結果を表示します。</p>
                 </div>

                 <div className="space-y-6 max-w-md mx-auto w-full flex-1">
                   <div>
                     <Label htmlFor="company">会社名（任意）</Label>
                     <input
                       id="company"
                       {...form.register("userInfo.companyName")}
                       className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1.5"
                       placeholder="株式会社〇〇"
                     />
                   </div>
                   <div>
                     <Label htmlFor="role">役職・役割（任意）</Label>
                     <input
                       id="role"
                       {...form.register("userInfo.role")}
                       className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1.5"
                       placeholder="PM、マネージャー、経営企画など"
                     />
                   </div>
                 </div>

                 <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
                   <Button 
                     type="submit" 
                     size="lg"
                     disabled={createAssessment.isPending}
                     className="w-full max-w-sm text-lg h-14 bg-gradient-to-r from-primary to-blue-600 hover:to-blue-700 shadow-lg shadow-blue-200"
                   >
                     {createAssessment.isPending ? "診断中..." : "診断結果を見る"}
                   </Button>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Footer */}
          {!isLastStep && (
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-sm border-t border-slate-100 flex justify-between items-center z-10">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="text-slate-500 hover:text-slate-900"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                戻る
              </Button>
              
              <div className="flex gap-1">
                {QUESTIONS.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentStep ? "bg-primary w-4" : idx < currentStep ? "bg-blue-200" : "bg-slate-100"
                    }`}
                  />
                ))}
              </div>

              <Button
                type="button"
                onClick={handleNext}
                className="bg-slate-900 hover:bg-slate-800 text-white px-8"
              >
                次へ
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </form>
      </div>
      
      {/* Help Text */}
      <div className="mt-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
        <AlertCircle className="w-4 h-4" />
        <p>回答内容は統計処理され、個人が特定される形で公開されることはありません。</p>
      </div>
    </div>
  );
}
