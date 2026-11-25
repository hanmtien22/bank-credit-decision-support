import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { predictRisk } from "./ml";
import { saveScoringRecord, getScoringHistory, getOrCreateDecisionThresholds, updateDecisionThresholds } from "./db";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  scoring: router({
    predict: protectedProcedure
      .input(z.object({
        amount: z.number().optional(),
        duration: z.number().optional(),
        payments: z.number().optional(),
        account_age_days: z.number().optional(),
        owner_age: z.number().optional(),
        n_disponents: z.number().optional(),
        n_orders: z.number().optional(),
        total_order_amount: z.number().optional(),
        avg_order_amount: z.number().optional(),
        n_trans_before_loan: z.number().optional(),
        avg_balance_before_loan: z.number().optional(),
        std_balance_before_loan: z.number().optional(),
        min_balance_before_loan: z.number().optional(),
        max_balance_before_loan: z.number().optional(),
        last_balance_before_loan: z.number().optional(),
        avg_amount_before_loan: z.number().optional(),
        total_amount_before_loan: z.number().optional(),
        purpose: z.string().optional(),
        frequency: z.string().optional(),
        region: z.string().optional(),
        division: z.string().optional(),
        owner_sex: z.string().optional(),
        is_local_client: z.number().optional(),
        has_card_before_loan: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Get user's decision thresholds
          const thresholds = await getOrCreateDecisionThresholds(ctx.user.id);
          
          // Make prediction
          const prediction = await predictRisk(input);
          
          if (!prediction.success) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: prediction.error || "Prediction failed",
            });
          }
          
          // Determine decision status based on thresholds
          const riskProb = prediction.riskProbability!;
          const riskThreshold = parseFloat(thresholds.riskThreshold as any);
          const approvalThreshold = parseFloat(thresholds.approvalThreshold as any);
          const autoReviewThreshold = parseFloat(thresholds.autoReviewThreshold as any);
          
          let decisionStatus = "Cần kiểm duyệt";
          if (riskProb <= autoReviewThreshold) {
            decisionStatus = "Tự động duyệt";
          } else if (riskProb >= approvalThreshold) {
            decisionStatus = "Từ chối";
          }
          
          // Save scoring record
          await saveScoringRecord({
            userId: ctx.user.id,
            amount: input.amount ? (input.amount.toString() as any) : null,
            duration: input.duration,
            payments: input.payments ? (input.payments.toString() as any) : null,
            accountAgeDays: input.account_age_days,
            ownerAge: input.owner_age,
            nDisponents: input.n_disponents,
            nOrders: input.n_orders,
            totalOrderAmount: input.total_order_amount ? (input.total_order_amount.toString() as any) : null,
            avgOrderAmount: input.avg_order_amount ? (input.avg_order_amount.toString() as any) : null,
            nTransBeforeLoan: input.n_trans_before_loan,
            avgBalanceBeforeLoan: input.avg_balance_before_loan ? (input.avg_balance_before_loan.toString() as any) : null,
            stdBalanceBeforeLoan: input.std_balance_before_loan ? (input.std_balance_before_loan.toString() as any) : null,
            minBalanceBeforeLoan: input.min_balance_before_loan ? (input.min_balance_before_loan.toString() as any) : null,
            maxBalanceBeforeLoan: input.max_balance_before_loan ? (input.max_balance_before_loan.toString() as any) : null,
            lastBalanceBeforeLoan: input.last_balance_before_loan ? (input.last_balance_before_loan.toString() as any) : null,
            avgAmountBeforeLoan: input.avg_amount_before_loan ? (input.avg_amount_before_loan.toString() as any) : null,
            totalAmountBeforeLoan: input.total_amount_before_loan ? (input.total_amount_before_loan.toString() as any) : null,
            purpose: input.purpose,
            frequency: input.frequency,
            region: input.region,
            division: input.division,
            ownerSex: input.owner_sex,
            isLocalClient: input.is_local_client,
            hasCardBeforeLoan: input.has_card_before_loan,
            riskProbability: (riskProb.toFixed(4) as any),
            riskLabel: prediction.riskLabel!,
            riskThreshold: (riskThreshold.toFixed(4) as any),
            approvalThreshold: (approvalThreshold.toFixed(4) as any),
            autoReviewThreshold: (autoReviewThreshold.toFixed(4) as any),
            decisionStatus,
          });
          
          return {
            riskProbability: prediction.riskProbability,
            riskLabel: prediction.riskLabel,
            decisionStatus,
            modelMetrics: prediction.modelMetrics,
          };
        } catch (error) {
          console.error("Scoring error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Scoring failed",
          });
        }
      }),
    
    history: protectedProcedure
      .input(z.object({
        limit: z.number().optional().default(50),
      }))
      .query(async ({ input, ctx }) => {
        return getScoringHistory(ctx.user.id, input.limit);
      }),
    
    thresholds: router({
      get: protectedProcedure.query(async ({ ctx }) => {
        return getOrCreateDecisionThresholds(ctx.user.id);
      }),
      
      update: protectedProcedure
        .input(z.object({
          riskThreshold: z.string().optional(),
          approvalThreshold: z.string().optional(),
          autoReviewThreshold: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          return updateDecisionThresholds(ctx.user.id, input as any);
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
