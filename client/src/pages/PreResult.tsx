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
      setLocation(`/result/${params?.id}`);
    }, 2000); // Slightly longer for the "parsing" effect
    return () => clearTimeout(timer);
  }, [params?.id, setLocation]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">組織の歪みを解析しています…</h2>
        <p className="text-slate-500">優先課題を特定しています。少々お待ちください。</p>
      </motion.div>
    </div>
  );
}
