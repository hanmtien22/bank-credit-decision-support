import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface FormData {
  // Loan Information
  amount?: number;
  duration?: number;
  payments?: number;
  // Account Information
  account_age_days?: number;
  owner_age?: number;
  n_disponents?: number;
  // Transaction Information
  n_orders?: number;
  total_order_amount?: number;
  avg_order_amount?: number;
  n_trans_before_loan?: number;
  avg_balance_before_loan?: number;
  std_balance_before_loan?: number;
  min_balance_before_loan?: number;
  max_balance_before_loan?: number;
  last_balance_before_loan?: number;
  avg_amount_before_loan?: number;
  total_amount_before_loan?: number;
  // Categorical Information
  purpose?: string;
  frequency?: string;
  region?: string;
  division?: string;
  owner_sex?: string;
  is_local_client?: number;
  has_card_before_loan?: number;
}

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

interface ScoringFormProps {
  onResultReceived?: (result: ScoringResult) => void;
}

export default function ScoringForm({ onResultReceived }: ScoringFormProps) {
  const [formData, setFormData] = useState<FormData>({
    amount: 150000,
    duration: 36,
    payments: 5000,
    account_age_days: 500,
    owner_age: 30,
    n_disponents: 2,
    n_orders: 2,
    total_order_amount: 3000,
    avg_order_amount: 1500,
    n_trans_before_loan: 20,
    avg_balance_before_loan: 10000,
    std_balance_before_loan: 8000,
    min_balance_before_loan: 500,
    max_balance_before_loan: 20000,
    last_balance_before_loan: 1500,
    avg_amount_before_loan: 5000,
    total_amount_before_loan: 100000,
    purpose: "other",
    frequency: "monthly",
    region: "Prague",
    division: "Central",
    owner_sex: "M",
    is_local_client: 1,
    has_card_before_loan: 1,
  });
  const [result, setResult] = useState<ScoringResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const predictMutation = trpc.scoring.predict.useMutation();

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value === "" ? undefined : value
    }));
  };

  const handleNumericChange = (field: keyof FormData, value: string) => {
    const numValue = value === "" ? undefined : parseFloat(value);
    handleInputChange(field, numValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate at least some fields are filled
    const filledFields = Object.values(formData).filter(v => v !== undefined && v !== "").length;
    if (filledFields === 0) {
      toast.error("Vui lòng nhập ít nhất một trường thông tin");
      return;
    }

    setIsLoading(true);
    try {
      const response = await predictMutation.mutateAsync(formData);
      const typedResult: ScoringResult = {
        riskProbability: response.riskProbability || 0,
        riskLabel: response.riskLabel || "Good",
        decisionStatus: response.decisionStatus,
        modelMetrics: response.modelMetrics || { rocAuc: 0, f1: 0, accuracy: 0, precision: 0, recall: 0 },
      };
      setResult(typedResult);
      onResultReceived?.(typedResult);
      toast.success("Dự đoán thành công");
    } catch (error) {
      console.error("Prediction error:", error);
      toast.error(error instanceof Error ? error.message : "Dự đoán thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({});
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nhập Thông Tin Khoản Vay</CardTitle>
          <CardDescription>Điền đầy đủ thông tin để chấm điểm rủi ro tín dụng</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="loan" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="loan">Khoản Vay</TabsTrigger>
                <TabsTrigger value="account">Tài Khoản</TabsTrigger>
                <TabsTrigger value="transaction">Giao Dịch</TabsTrigger>
                <TabsTrigger value="category">Phân Loại</TabsTrigger>
              </TabsList>

              {/* Loan Information Tab */}
              <TabsContent value="loan" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Số Tiền Vay</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="Nhập số tiền"
                      value={formData.amount ?? ""}
                      onChange={(e) => handleNumericChange("amount", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Thời Hạn Vay (tháng)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="Nhập thời hạn"
                      value={formData.duration ?? ""}
                      onChange={(e) => handleNumericChange("duration", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="payments">Số Kỳ Thanh Toán</Label>
                    <Input
                      id="payments"
                      type="number"
                      step="0.01"
                      placeholder="Nhập số kỳ"
                      value={formData.payments ?? ""}
                      onChange={(e) => handleNumericChange("payments", e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Account Information Tab */}
              <TabsContent value="account" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="account_age_days">Tuổi Tài Khoản (ngày)</Label>
                    <Input
                      id="account_age_days"
                      type="number"
                      placeholder="Nhập số ngày"
                      value={formData.account_age_days ?? ""}
                      onChange={(e) => handleNumericChange("account_age_days", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner_age">Tuổi Chủ Tài Khoản (năm)</Label>
                    <Input
                      id="owner_age"
                      type="number"
                      placeholder="Nhập tuổi"
                      value={formData.owner_age ?? ""}
                      onChange={(e) => handleNumericChange("owner_age", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="n_disponents">Số Người Có Quyền Trên Tài Khoản</Label>
                    <Input
                      id="n_disponents"
                      type="number"
                      placeholder="Nhập số người"
                      value={formData.n_disponents ?? ""}
                      onChange={(e) => handleNumericChange("n_disponents", e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Transaction Information Tab */}
              <TabsContent value="transaction" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="n_orders">Số Lệnh Thanh Toán Định Kỳ</Label>
                    <Input
                      id="n_orders"
                      type="number"
                      placeholder="Nhập số lệnh"
                      value={formData.n_orders ?? ""}
                      onChange={(e) => handleNumericChange("n_orders", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="total_order_amount">Tổng Giá Trị Lệnh</Label>
                    <Input
                      id="total_order_amount"
                      type="number"
                      step="0.01"
                      placeholder="Nhập tổng giá trị"
                      value={formData.total_order_amount ?? ""}
                      onChange={(e) => handleNumericChange("total_order_amount", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="avg_order_amount">Giá Trị Lệnh Trung Bình</Label>
                    <Input
                      id="avg_order_amount"
                      type="number"
                      step="0.01"
                      placeholder="Nhập giá trị trung bình"
                      value={formData.avg_order_amount ?? ""}
                      onChange={(e) => handleNumericChange("avg_order_amount", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="n_trans_before_loan">Số Giao Dịch Trước Vay</Label>
                    <Input
                      id="n_trans_before_loan"
                      type="number"
                      placeholder="Nhập số giao dịch"
                      value={formData.n_trans_before_loan ?? ""}
                      onChange={(e) => handleNumericChange("n_trans_before_loan", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="avg_balance_before_loan">Số Dư Trung Bình Trước Vay</Label>
                    <Input
                      id="avg_balance_before_loan"
                      type="number"
                      step="0.01"
                      placeholder="Nhập số dư trung bình"
                      value={formData.avg_balance_before_loan ?? ""}
                      onChange={(e) => handleNumericChange("avg_balance_before_loan", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="std_balance_before_loan">Độ Lệch Chuẩn Số Dư Trước Vay</Label>
                    <Input
                      id="std_balance_before_loan"
                      type="number"
                      step="0.01"
                      placeholder="Nhập độ lệch chuẩn"
                      value={formData.std_balance_before_loan ?? ""}
                      onChange={(e) => handleNumericChange("std_balance_before_loan", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="min_balance_before_loan">Số Dư Tối Thiểu Trước Vay</Label>
                    <Input
                      id="min_balance_before_loan"
                      type="number"
                      step="0.01"
                      placeholder="Nhập số dư tối thiểu"
                      value={formData.min_balance_before_loan ?? ""}
                      onChange={(e) => handleNumericChange("min_balance_before_loan", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_balance_before_loan">Số Dư Tối Đa Trước Vay</Label>
                    <Input
                      id="max_balance_before_loan"
                      type="number"
                      step="0.01"
                      placeholder="Nhập số dư tối đa"
                      value={formData.max_balance_before_loan ?? ""}
                      onChange={(e) => handleNumericChange("max_balance_before_loan", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_balance_before_loan">Số Dư Cuối Cùng Trước Vay</Label>
                    <Input
                      id="last_balance_before_loan"
                      type="number"
                      step="0.01"
                      placeholder="Nhập số dư cuối cùng"
                      value={formData.last_balance_before_loan ?? ""}
                      onChange={(e) => handleNumericChange("last_balance_before_loan", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="avg_amount_before_loan">Giá Trị Giao Dịch Trung Bình Trước Vay</Label>
                    <Input
                      id="avg_amount_before_loan"
                      type="number"
                      step="0.01"
                      placeholder="Nhập giá trị trung bình"
                      value={formData.avg_amount_before_loan ?? ""}
                      onChange={(e) => handleNumericChange("avg_amount_before_loan", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="total_amount_before_loan">Tổng Giá Trị Giao Dịch Trước Vay</Label>
                    <Input
                      id="total_amount_before_loan"
                      type="number"
                      step="0.01"
                      placeholder="Nhập tổng giá trị"
                      value={formData.total_amount_before_loan ?? ""}
                      onChange={(e) => handleNumericChange("total_amount_before_loan", e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Categorical Information Tab */}
              <TabsContent value="category" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purpose">Mục Đích Vay</Label>
                    <Input
                      id="purpose"
                      type="text"
                      placeholder="Nhập mục đích"
                      value={formData.purpose ?? ""}
                      onChange={(e) => handleInputChange("purpose", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="frequency">Tần Suất Giao Dịch</Label>
                    <Input
                      id="frequency"
                      type="text"
                      placeholder="Nhập tần suất"
                      value={formData.frequency ?? ""}
                      onChange={(e) => handleInputChange("frequency", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="region">Khu Vực</Label>
                    <Input
                      id="region"
                      type="text"
                      placeholder="Nhập khu vực"
                      value={formData.region ?? ""}
                      onChange={(e) => handleInputChange("region", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="division">Bộ Phận</Label>
                    <Input
                      id="division"
                      type="text"
                      placeholder="Nhập bộ phận"
                      value={formData.division ?? ""}
                      onChange={(e) => handleInputChange("division", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner_sex">Giới Tính Chủ Tài Khoản</Label>
                    <Select value={formData.owner_sex ?? ""} onValueChange={(v) => handleInputChange("owner_sex", v)}>
                      <SelectTrigger id="owner_sex">
                        <SelectValue placeholder="Chọn giới tính" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Nam</SelectItem>
                        <SelectItem value="F">Nữ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="is_local_client">Khách Hàng Địa Phương</Label>
                    <Select value={formData.is_local_client?.toString() ?? ""} onValueChange={(v) => handleInputChange("is_local_client", parseInt(v))}>
                      <SelectTrigger id="is_local_client">
                        <SelectValue placeholder="Chọn" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Không</SelectItem>
                        <SelectItem value="1">Có</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="has_card_before_loan">Có Thẻ Trước Vay</Label>
                    <Select value={formData.has_card_before_loan?.toString() ?? ""} onValueChange={(v) => handleInputChange("has_card_before_loan", parseInt(v))}>
                      <SelectTrigger id="has_card_before_loan">
                        <SelectValue placeholder="Chọn" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Không</SelectItem>
                        <SelectItem value="1">Có</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={handleReset}>
                Xóa
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                {isLoading ? "Đang xử lý..." : "Chấm Điểm"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Kết Quả Chấm Điểm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-gray-600">Xác Suất Rủi Ro</p>
                <p className="text-3xl font-bold text-blue-600">{(result.riskProbability * 100).toFixed(2)}%</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-gray-600">Nhãn Kết Luận</p>
                <p className={`text-xl font-semibold ${result.riskLabel === "Good" ? "text-green-600" : "text-red-600"}`}>
                  {result.riskLabel === "Good" ? "Good – Rủi ro thấp" : "Bad – Rủi ro cao"}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-gray-600">Trạng Thái Quyết Định</p>
                <p className={`text-lg font-semibold ${
                  result.decisionStatus === "Tự động duyệt" ? "text-green-600" :
                  result.decisionStatus === "Cần kiểm duyệt" ? "text-yellow-600" :
                  "text-red-600"
                }`}>
                  {result.decisionStatus}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-gray-600">Hiệu Suất Mô Hình</p>
                <div className="text-sm space-y-1">
                  <p>ROC-AUC: {result.modelMetrics.rocAuc.toFixed(4)}</p>
                  <p>F1: {result.modelMetrics.f1.toFixed(4)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
