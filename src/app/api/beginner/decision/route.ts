import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request:Request){
  const client=await createClient();
  const {data:{user}}=await client.auth.getUser();
  if(!user) return NextResponse.json({error:"Sesión requerida."},{status:401});
  const body=await request.json().catch(()=>null) as Record<string,unknown>|null;
  if(!body||typeof body.title!=="string") return NextResponse.json({error:"Título requerido."},{status:400});
  const amount=body.amount===""||body.amount==null?null:Number(body.amount);
  const {data,error}=await client.rpc("save_investor_decision",{
    p_listing_id:null,p_goal_id:null,p_title:body.title.slice(0,120),
    p_thesis:typeof body.thesis==="string"?body.thesis.slice(0,2000):"",
    p_risks:typeof body.risks==="string"?body.risks.slice(0,2000):"",
    p_alternatives:typeof body.alternatives==="string"?body.alternatives.slice(0,2000):"",
    p_doubts:typeof body.doubts==="string"?body.doubts.slice(0,2000):"",
    p_amount:Number.isFinite(amount as number)?amount:null,
    p_currency:body.currency==="USD"?"USD":"PEN",p_horizon_years:null,p_decision_status:"considering",
  });
  if(error) return NextResponse.json({error:"No se pudo guardar la decisión."},{status:400});
  return NextResponse.json({id:data});
}
