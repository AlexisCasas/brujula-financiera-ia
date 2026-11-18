import "server-only";
import { createClient } from "@/lib/supabase/server";
export type HistoricalObservation={listing_id:string;observed_on:string;currency:string;close:number};
export async function getHistoricalObservations(listingId:string):Promise<HistoricalObservation[]>{
 const client=await createClient();
 const {data,error}=await client.from("instrument_price_observation").select("listing_id,observed_on,currency,close").eq("listing_id",listingId).order("observed_on",{ascending:true}).limit(5000);
 return error?( []):(data as HistoricalObservation[]??[]);
}
