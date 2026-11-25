import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

interface ThresholdPanelProps {
  onThresholdsUpdated?: () => void;
}

export default function ThresholdPanel({ onThresholdsUpdated }: ThresholdPanelProps) {
  const [riskThreshold, setRiskThreshold] = useState(0.5);
  const [approvalThreshold, setApprovalThreshold] = useState(0.7248);
  const [autoReviewThreshold, setAutoReviewThreshold] = useState(0.3);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const getThresholds = trpc.scoring.thresholds.get.useQuery();
  const updateThresholds = trpc.scoring.thresholds.update.useMutation();

  useEffect(() => {
    if (getThresholds.data) {
      setRiskThreshold(parseFloat(getThresholds.data.riskThreshold as any));
      setApprovalThreshold(parseFloat(getThresholds.data.approvalThreshold as any));
      setAutoReviewThreshold(parseFloat(getThresholds.data.autoReviewThreshold as any));
      setIsLoading(false);
    }
  }, [getThresholds.data]);

  const handleSave = async () => {
    // Validate thresholds
    if (autoReviewThreshold >= riskThreshold) {
      toast.error("Mốc Tự kiểm duyệt phải nhỏ hơn Mốc Rủi ro");
      return;
    }
    if (riskThreshold >= approvalThreshold) {
      toast.error("Mốc Rủi ro phải nhỏ hơn Mốc Duyệt");
      return;
    }

    setIsSaving(true);
    try {
      await updateThresholds.mutateAsync({
        riskThreshold: riskThreshold.toFixed(4),
        approvalThreshold: approvalThreshold.toFixed(4),
        autoReviewThreshold: autoReviewThreshold.toFixed(4),
      });
      toast.success("Cập nhật mốc ngưỡng thành công");
      onThresholdsUpdated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cập nhật thất bại");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setRiskThreshold(0.5);
    setApprovalThreshold(0.7248);
    setAutoReviewThreshold(0.3);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Spinner className="mr-2" />
          <span>Đang tải mốc ngưỡng...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mốc Quyết Định</CardTitle>
          <CardDescription>
            Điều chỉnh ba mốc ngưỡng để xác định trạng thái quyết định khoản vay
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Auto Review Threshold */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">Mốc Tự kiểm duyệt</Label>
                <p className="text-sm text-gray-600 mt-1">
                  Khoản vay có xác suất rủi ro ≤ mốc này sẽ được tự động duyệt
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{(autoReviewThreshold * 100).toFixed(2)}%</div>
                <div className="flex items-center gap-1 text-green-600 text-sm mt-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tự động duyệt</span>
                </div>
              </div>
            </div>
            <Slider
              value={[autoReviewThreshold]}
              onValueChange={(value) => setAutoReviewThreshold(value[0])}
              min={0}
              max={1}
              step={0.01}
              className="w-full"
            />
            <Input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={autoReviewThreshold.toFixed(4)}
              onChange={(e) => setAutoReviewThreshold(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Risk Threshold */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">Mốc Rủi ro</Label>
                <p className="text-sm text-gray-600 mt-1">
                  Khoản vay có xác suất rủi ro nằm giữa mốc tự kiểm duyệt và mốc này cần kiểm duyệt
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-600">{(riskThreshold * 100).toFixed(2)}%</div>
                <div className="flex items-center gap-1 text-yellow-600 text-sm mt-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>Cần kiểm duyệt</span>
                </div>
              </div>
            </div>
            <Slider
              value={[riskThreshold]}
              onValueChange={(value) => setRiskThreshold(value[0])}
              min={0}
              max={1}
              step={0.01}
              className="w-full"
            />
            <Input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={riskThreshold.toFixed(4)}
              onChange={(e) => setRiskThreshold(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Approval Threshold */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">Mốc Duyệt</Label>
                <p className="text-sm text-gray-600 mt-1">
                  Khoản vay có xác suất rủi ro ≥ mốc này sẽ bị từ chối
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-600">{(approvalThreshold * 100).toFixed(2)}%</div>
                <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
                  <XCircle className="w-4 h-4" />
                  <span>Từ chối</span>
                </div>
              </div>
            </div>
            <Slider
              value={[approvalThreshold]}
              onValueChange={(value) => setApprovalThreshold(value[0])}
              min={0}
              max={1}
              step={0.01}
              className="w-full"
            />
            <Input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={approvalThreshold.toFixed(4)}
              onChange={(e) => setApprovalThreshold(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Threshold Visualization */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-semibold text-gray-700 mb-3">Biểu Đồ Phân Vùng Quyết Định</p>
            <div className="relative h-12 bg-white border rounded-lg overflow-hidden flex">
              {/* Auto Review Zone */}
              <div
                className="bg-green-200 flex items-center justify-center text-xs font-semibold text-green-700"
                style={{ width: `${autoReviewThreshold * 100}%` }}
              >
                {autoReviewThreshold > 0.1 && "Tự động duyệt"}
              </div>
              {/* Risk Zone */}
              <div
                className="bg-yellow-200 flex items-center justify-center text-xs font-semibold text-yellow-700"
                style={{ width: `${(riskThreshold - autoReviewThreshold) * 100}%` }}
              >
                {riskThreshold - autoReviewThreshold > 0.15 && "Cần kiểm duyệt"}
              </div>
              {/* Rejection Zone */}
              <div
                className="bg-red-200 flex items-center justify-center text-xs font-semibold text-red-700"
                style={{ width: `${(1 - approvalThreshold) * 100}%` }}
              >
                {1 - approvalThreshold > 0.1 && "Từ chối"}
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={handleReset}>
              Đặt Lại Mặc Định
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving && <Spinner className="mr-2 h-4 w-4" />}
              {isSaving ? "Đang lưu..." : "Lưu Mốc Ngưỡng"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">Hướng Dẫn Sử Dụng</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700 space-y-2">
          <p>
            <strong>Mốc Tự kiểm duyệt:</strong> Xác suất rủi ro dưới mốc này → Tự động duyệt
          </p>
          <p>
            <strong>Mốc Rủi ro:</strong> Xác suất rủi ro nằm giữa hai mốc → Cần kiểm duyệt thêm
          </p>
          <p>
            <strong>Mốc Duyệt:</strong> Xác suất rủi ro trên mốc này → Từ chối
          </p>
          <p className="pt-2 text-blue-700">
            💡 Điều chỉnh các mốc này để phù hợp với chính sách rủi ro của tổ chức
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
