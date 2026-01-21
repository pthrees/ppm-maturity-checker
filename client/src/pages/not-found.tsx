import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md mx-4 shadow-xl">
        <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">404 Page Not Found</h1>
          <p className="text-slate-600 mb-8">
            お探しのページは見つかりませんでした。<br/>
            URLが正しいかご確認ください。
          </p>

          <Link href="/" className="w-full">
            <button className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors">
              トップページに戻る
            </button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
