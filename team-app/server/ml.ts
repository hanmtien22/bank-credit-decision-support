import { spawn } from "child_process";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface PredictionInput {
  amount?: number;
  duration?: number;
  payments?: number;
  account_age_days?: number;
  owner_age?: number;
  n_disponents?: number;
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
  purpose?: string;
  frequency?: string;
  region?: string;
  division?: string;
  owner_sex?: string;
  is_local_client?: number;
  has_card_before_loan?: number;
}

interface PredictionResult {
  success: boolean;
  riskProbability?: number;
  riskLabel?: string;
  modelMetrics?: {
    rocAuc: number;
    f1: number;
    accuracy: number;
    precision: number;
    recall: number;
  };
  error?: string;
}

export async function predictRisk(input: PredictionInput): Promise<PredictionResult> {
  return new Promise((resolve, reject) => {
    const pythonScript = join(__dirname, "ml_models", "predict.py");
    const python = spawn("python", [pythonScript]);

    let stdout = "";
    let stderr = "";

    python.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    python.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    python.on("close", (code) => {
      if (code !== 0) {
        console.error("Python error:", stderr);
        reject(new Error(`Python process exited with code ${code}: ${stderr}`));
        return;
      }

      try {
        const result = JSON.parse(stdout) as PredictionResult;
        resolve(result);
      } catch (error) {
        console.error("Failed to parse Python output:", stdout);
        reject(new Error(`Failed to parse prediction result: ${stdout}`));
      }
    });

    // Send input to Python process
    python.stdin?.write(JSON.stringify(input));
    python.stdin?.end();
  });
}
