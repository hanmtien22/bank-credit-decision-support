import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface ScoringResultProps {
  riskProbability: number;
  riskLabel: string;
  decisionStatus: string;
  modelMetrics: {
    rocAuc: number;
    f1: number;
    accuracy: number;
    precision: number;
    recall: number;
  };
}

export default function ScoringResult({
  riskProbability,
  riskLabel,
  decisionStatus,
  modelMetrics,
}: ScoringResultProps) {
  const riskPercentage = riskProbability * 100;
  
  const getDecisionIcon = () => {
    switch (decisionStatus) {
      case "Tự động duyệt":
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case "Cần kiểm duyệt":
        return <AlertCircle className="w-6 h-6 text-yellow-600" />;
      case "Từ chối":
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return null;
    }
  };

  const getDecisionColor = () => {
    switch (decisionStatus) {
      case "Tự động duyệt":
        return "bg-green-50 border-green-200";
      case "Cần kiểm duyệt":
        return "bg-yellow-50 border-yellow-200";
      case "Từ chối":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getRiskColor = () => {
    if (riskPercentage <= 30) return "bg-green-100";
    if (riskPercentage <= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  const getRiskLabel = () => {
    return riskLabel === "Good" ? "Good – Rủi ro thấp" : "Bad – Rủi ro cao";
  };

  return (
    <div className="space-y-6">
      {/* Risk Score Gauge */}
      <Card>
        <CardHeader>
          <CardTitle>Điểm Rủi Ro</CardTitle>
          <CardDescription>Xác suất vay không được trả lại</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Xác suất rủi ro</span>
              <span className="text-3xl font-bold text-blue-600">{riskPercentage.toFixed(2)}%</span>
            </div>
            <Progress value={riskPercentage} className="h-3" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Thấp (0%)</span>
              <span>Cao (100%)</span>
            </div>
          </div>

          {/* Risk Label */}
          <div className={`p-4 rounded-lg border-2 ${getRiskColor()}`}>
            <p className="text-sm text-gray-600 mb-1">Nhãn Kết Luận</p>
            <p className={`text-xl font-bold ${riskLabel === "Good" ? "text-green-700" : "text-red-700"}`}>
              {getRiskLabel()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Decision Status */}
      <Card className={`border-2 ${getDecisionColor()}`}>
        <CardHeader>
          <CardTitle>Trạng Thái Quyết Định</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {getDecisionIcon()}
            <div>
              <p className="text-lg font-semibold">{decisionStatus}</p>
              <p className="text-sm text-gray-600 mt-1">
                {decisionStatus === "Tự động duyệt" && "Khoản vay được phê duyệt tự động"}
                {decisionStatus === "Cần kiểm duyệt" && "Cần nhân viên kiểm duyệt thêm"}
                {decisionStatus === "Từ chối" && "Khoản vay bị từ chối"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Hiệu Suất Mô Hình</CardTitle>
          <CardDescription>Chỉ số đánh giá mô hình trên tập test</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <p className="text-xs text-gray-600 font-medium">ROC-AUC</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{modelMetrics.rocAuc.toFixed(4)}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <p className="text-xs text-gray-600 font-medium">F1 Score</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{modelMetrics.f1.toFixed(4)}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <p className="text-xs text-gray-600 font-medium">Accuracy</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{modelMetrics.accuracy.toFixed(4)}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
              <p className="text-xs text-gray-600 font-medium">Precision</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{modelMetrics.precision.toFixed(4)}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
              <p className="text-xs text-gray-600 font-medium">Recall</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{modelMetrics.recall.toFixed(4)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
