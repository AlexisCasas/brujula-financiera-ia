export function simpleReturns(values:readonly number[]):number[]{const out:number[]=[];for(let i=1;i<values.length;i++){if(values[i-1]>0)out.push(values[i]/values[i-1]-1);}return out;}
export function annualizedVolatility(values:readonly number[]):number|null{
 const r=simpleReturns(values); if(r.length<2)return null; const mean=r.reduce((a,b)=>a+b,0)/r.length; const variance=r.reduce((s,x)=>s+(x-mean)**2,0)/(r.length-1); return Math.sqrt(variance*12);
}
export function maxDrawdownPct(values:readonly number[]):number|null{
 if(values.length<2)return null; let peak=values[0],max=0; for(const v of values.slice(1)){peak=Math.max(peak,v);if(peak>0)max=Math.max(max,(peak-v)/peak);} return max;
}
export function periodReturnPct(values:readonly number[]):number|null{if(values.length<2||values[0]<=0)return null;return values[values.length-1]/values[0]-1;}
