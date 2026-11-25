import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { RefreshCw, Download } from "lucide-react";

interface ScoringHistoryProps {
  refreshTrigger?: number;
}

export default function ScoringHistory({ refreshTrigger }: ScoringHistoryProps) {
  const [limit, setLimit] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: history, isLoading, refetch } = trpc.scoring.history.useQuery({ limit });

  const filteredHistory = history?.filter(record => {
    const searchLower = searchTerm.toLowerCase();
    return (
      record.riskLabel?.toLowerCase().includes(searchLower) ||
      record.decisionStatus?.toLowerCase().includes(searchLower) ||
      record.purpose?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleRefresh = () => {
    refetch();
  };

  const handleDownloadCSV = () => {
    if (!history || history.length === 0) return;

    const headers = [
      "Ngày Chấm Điểm",
      "Số Tiền Vay",
      "Xác Suất Rủi Ro",
      "Nhãn Kết Luận",
      "Trạng Thái Quyết Định",
      "Mục Đích Vay",
      "Mốc Rủi ro",
      "Mốc Duyệt",
      "Mốc Tự Kiểm Duyệt",
    ];

    const rows = history.map(record => [
      format(new Date(record.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: vi }),
      record.amount || "",
      (parseFloat(record.riskProbability as any) * 100).toFixed(2) + "%",
      record.riskLabel || "",
      record.decisionStatus || "",
      record.purpose || "",
      (parseFloat(record.riskThreshold as any) * 100).toFixed(2) + "%",
      (parseFloat(record.approvalThreshold as any) * 100).toFixed(2) + "%",
      (parseFloat(record.autoReviewThreshold as any) * 100).toFixed(2) + "%",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `scoring-history-${format(new Date(), "yyyyMMdd-HHmmss")}.csv`;
    link.click();
  };

  const getDecisionBadgeColor = (status: string) => {
    switch (status) {
      case "Tự động duyệt":
        return "bg-green-100 text-green-800";
      case "Cần kiểm duyệt":
        return "bg-yellow-100 text-yellow-800";
      case "Từ chối":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRiskBadgeColor = (label: string) => {
    return label === "Good" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lịch Sử Chấm Điểm</CardTitle>
          <CardDescription>Xem lại các lần chấm điểm trước đây</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex gap-4 flex-col sm:flex-row">
            <div className="flex-1">
              <Input
                placeholder="Tìm kiếm theo nhãn, trạng thái, hoặc mục đích..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {isLoading ? "Đang tải..." : "Làm Mới"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCSV}
              disabled={!history || history.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Tải CSV
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="mr-2" />
                <span>Đang tải lịch sử...</span>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {history?.length === 0 ? "Chưa có lịch sử chấm điểm" : "Không tìm thấy kết quả phù hợp"}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Ngày Chấm Điểm</TableHead>
                    <TableHead className="font-semibold">Số Tiền Vay</TableHead>
                    <TableHead className="font-semibold text-right">Xác Suất Rủi Ro</TableHead>
                    <TableHead className="font-semibold">Nhãn Kết Luận</TableHead>
                    <TableHead className="font-semibold">Trạng Thái Quyết Định</TableHead>
                    <TableHead className="font-semibold">Mục Đích Vay</TableHead>
                    <TableHead className="font-semibold text-right">Mốc Rủi ro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((record) => (
                    <TableRow key={record.id} className="hover:bg-gray-50">
                      <TableCell className="text-sm">
                        {format(new Date(record.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: vi })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {record.amount ? `${parseFloat(record.amount as any).toLocaleString("vi-VN")}` : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-right font-semibold">
                        {(parseFloat(record.riskProbability as any) * 100).toFixed(2)}%
                      </TableCell>
                      <TableCell>
                        <Badge className={getRiskBadgeColor(record.riskLabel || "")}>
                          {record.riskLabel === "Good" ? "Good – Rủi ro thấp" : "Bad – Rủi ro cao"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getDecisionBadgeColor(record.decisionStatus || "")}>
                          {record.decisionStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{record.purpose || "-"}</TableCell>
                      <TableCell className="text-sm text-right">
                        {(parseFloat(record.riskThreshold as any) * 100).toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Summary */}
          {filteredHistory.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Tổng Số Lần Chấm</p>
                <p className="text-2xl font-bold text-blue-600">{filteredHistory.length}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Tự Động Duyệt</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredHistory.filter(r => r.decisionStatus === "Tự động duyệt").length}
                </p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Cần Kiểm Duyệt</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredHistory.filter(r => r.decisionStatus === "Cần kiểm duyệt").length}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Từ Chối</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredHistory.filter(r => r.decisionStatus === "Từ chối").length}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
