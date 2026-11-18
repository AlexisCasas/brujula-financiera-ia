export type GoalObjective = "wealth" | "retirement" | "home" | "education" | "income" | "learning" | "other";
export type Currency = "PEN" | "USD";
export type Periodicity = "monthly" | "quarterly" | "annual" | "none";

export const GOAL_OBJECTIVES: readonly { value: GoalObjective; label: string }[] = [
  { value: "wealth", label: "Crear patrimonio" },
  { value: "retirement", label: "Jubilación" },
  { value: "home", label: "Comprar una vivienda" },
  { value: "education", label: "Educación" },
  { value: "income", label: "Complementar ingresos" },
  { value: "learning", label: "Aprender a invertir" },
  { value: "other", label: "Otro objetivo" },
];

export type SimulationInput = {
  initial: number;
  contribution: number;
  years: number;
  annualRates: readonly number[];
  periodicity: Exclude<Periodicity, "none">;
};

export type SimulationPoint = { year: number; contributed: number; value: number };

export function simulateScenario(input: SimulationInput): SimulationPoint[] {
  const months = Math.max(1, Math.round(input.years * 12));
  const contributionMonths = input.periodicity === "monthly" ? 1 : input.periodicity === "quarterly" ? 3 : 12;
  const points: SimulationPoint[] = [{ year: 0, contributed: input.initial, value: input.initial }];
  let value = Math.max(0, input.initial);
  let contributed = Math.max(0, input.initial);
  for (let month = 1; month <= months; month += 1) {
    const yearIndex = Math.min(input.annualRates.length - 1, Math.floor((month - 1) / 12));
    const annualRate = input.annualRates[Math.max(0, yearIndex)] ?? 0;
    const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
    value *= 1 + monthlyRate;
    if (month % contributionMonths === 0 && input.contribution > 0) {
      value += input.contribution;
      contributed += input.contribution;
    }
    if (month % 12 === 0 || month === months) {
      points.push({ year: month / 12, contributed: round2(contributed), value: round2(value) });
    }
  }
  return points;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function annualizedReturn(start: number, end: number, years: number): number | null {
  if (!(start > 0) || !(end > 0) || !(years > 0)) return null;
  return Math.pow(end / start, 1 / years) - 1;
}

export function maxDrawdown(values: readonly number[]): number | null {
  if (values.length < 2) return null;
  let peak = values[0];
  let max = 0;
  for (const value of values.slice(1)) {
    peak = Math.max(peak, value);
    if (peak > 0) max = Math.max(max, (peak - value) / peak);
  }
  return max;
}

export function volatility(values: readonly number[]): number | null {
  if (values.length < 2) return null;
  const returns = values.slice(1).map((v, i) => values[i] > 0 ? v / values[i] - 1 : null).filter((v): v is number => v !== null);
  if (returns.length < 2) return null;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  return Math.sqrt(variance * 12);
}
