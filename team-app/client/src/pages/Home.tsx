import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ScoringForm from "./ScoringForm";
import ScoringResult from "./ScoringResult";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ScoringResult {
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

export default function Home() {
  const [currentResult, setCurrentResult] = useState<ScoringResult | null>(null);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chấm Điểm Rủi Ro Tín Dụng</h1>
          <p className="text-gray-600 mt-2">
            Hệ thống hỗ trợ đánh giá rủi ro khoản vay dựa trên mô hình machine learning
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Column */}
          <div className="lg:col-span-1">
            <ScoringForm onResultReceived={setCurrentResult} />
          </div>

          {/* Result Column */}
          <div className="lg:col-span-2">
            {currentResult ? (
              <ScoringResult
                riskProbability={currentResult.riskProbability}
                riskLabel={currentResult.riskLabel}
                decisionStatus={currentResult.decisionStatus}
                modelMetrics={currentResult.modelMetrics}
              />
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[600px]">
                <CardContent className="text-center">
                  <p className="text-gray-500 text-lg">
                    Nhập thông tin khoản vay để xem kết quả chấm điểm
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mô Hình XGBoost</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Sử dụng mô hình XGBoost được huấn luyện với ROC-AUC = 0.9240 để dự đoán rủi ro khoản vay
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">12 Đặc Trưng</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Phân tích toàn diện từ thông tin khoản vay, tài khoản, giao dịch và thông tin cá nhân
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">3 Mốc Ngưỡng</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Điều chỉnh mốc rủi ro, mốc duyệt và mốc tự kiểm duyệt để phù hợp với chính sách
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
