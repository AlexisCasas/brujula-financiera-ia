import {describe,expect,it} from "vitest";
import {simulateScenario} from "@/lib/beginner-journey";
import {annualizedVolatility,maxDrawdownPct,periodReturnPct} from "@/lib/historical-risk";
describe("beginner journey calculations",()=>{
 it("simulates contributions deterministically",()=>{const r=simulateScenario({initial:1000,contribution:500,years:1,annualRates:[0],periodicity:"monthly"}).at(-1)!;expect(r.contributed).toBe(7000);expect(r.value).toBe(7000);});
 it("calculates period return",()=>{expect(periodReturnPct([100,110])).toBeCloseTo(.1);});
 it("calculates max drawdown",()=>{expect(maxDrawdownPct([100,120,90,110])).toBe(.25);});
 it("calculates annualized volatility from monthly returns",()=>{expect(annualizedVolatility([100,110,100])).toBeGreaterThan(0);});
});