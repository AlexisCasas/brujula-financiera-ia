import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export type InvestorGoal={id:string;objective:string;objective_detail:string|null;horizon_years:number;initial_amount:number|null;periodic_amount:number|null;periodicity:string;currency:"PEN"|"USD";priority:number;status:string;created_at:string;updated_at:string};
export async function listInvestorGoals():Promise<InvestorGoal[]>{
 const client=await createClient(); const {data:{user}}=await client.auth.getUser(); if(!user) redirect("/login");
 const {data,error}=await client.from("investor_goal").select("id,objective,objective_detail,horizon_years,initial_amount,periodic_amount,periodicity,currency,priority,status,created_at,updated_at").eq("status","active").order("updated_at",{ascending:false}).limit(10);
 return error?( []):(data as InvestorGoal[]??[]);
}
