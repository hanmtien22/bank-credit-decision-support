import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import DashboardLayout from "./components/DashboardLayout";
import ThresholdPanel from "./pages/ThresholdPanel";
import ScoringHistory from "./pages/ScoringHistory";

function ThresholdsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cấu Hình Mốc Quyết Định</h1>
          <p className="text-gray-600 mt-2">
            Điều chỉnh các mốc ngưỡng để phù hợp với chính sách rủi ro của tổ chức
          </p>
        </div>
        <ThresholdPanel />
      </div>
    </DashboardLayout>
  );
}

function HistoryPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lịch Sử Chấm Điểm</h1>
          <p className="text-gray-600 mt-2">
            Xem lại tất cả các lần chấm điểm rủi ro tín dụng
          </p>
        </div>
        <ScoringHistory />
      </div>
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/thresholds"} component={ThresholdsPage} />
      <Route path={"/history"} component={HistoryPage} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
