import {describe,expect,it} from "vitest";
import {filterProfiles,type EtfProfile} from "@/lib/etfs/catalog";
const base=(x:Partial<EtfProfile>):EtfProfile=>({listingId:"1",instrumentId:"1",ticker:"VWRA",exchange:"XLON",currency:"USD",isin:"X",name:"Vanguard FTSE All-World",issuer:"Vanguard",indexName:"FTSE All-World",domicile:"IE",distributionPolicy:"accumulating",inceptionDate:null,unverifiedCount:0,evidence:[],metrics:{ter_percent:null,net_assets:null,fund_net_assets:null},...x});
describe("exploration lenses",()=>{
 it("filters global and accumulating ETFs",()=>{const rows=[base({}),base({listingId:"2",ticker:"DIV",indexName:"Dividend Index",distributionPolicy:"distributing"})];expect(filterProfiles(rows,"","global")).toHaveLength(1);expect(filterProfiles(rows,"","accumulating")).toHaveLength(1);});
 it("filters USD",()=>{const rows=[base({}),base({listingId:"2",currency:"EUR"})];expect(filterProfiles(rows,"","usd")).toHaveLength(1);});
});