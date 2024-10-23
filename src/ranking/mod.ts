export * from "./ranking.ts";

/** Input column names */
export const input_labels = [
  "PopularInvestor",
  "Gain",
  "RiskScore",
  "MaxDailyRiskScore",
  "MaxMonthlyRiskScore",
  "Copiers",
  "CopiersGain",
  "AUMTier",
  "AUMTierV2",
  "Trades",
  "WinRatio",
  "DailyDD",
  "WeeklyDD",
  "ProfitableWeeksPct",
  "ProfitableMonthsPct",
  "Velocity",
  "Exposure",
  "AvgPosSize",
  "HighLeveragePct",
  "MediumLeveragePct",
  "LowLeveragePct",
  "PeakToValley",
  "LongPosPct",
  "ActiveWeeks",
  "ActiveWeeksPct",
  "WeeksSinceRegistration",
] as const;

/** 25 input parameters from stats */
export type Input = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

/** List of inputs */
export type Inputs = Array<Input>;

/** Output column names */
export const output_labels = ["SharpeRatio"] as const;

/** One output parameter; SharpeRatio */
export type Output = [number];

/** List of outputs */
export type Outputs = Array<Output>;
