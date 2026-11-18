"use client";

import { useState } from "react";

export function DecisionForm(){
  const [message,setMessage]=useState("");
  const [saving,setSaving]=useState(false);
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault(); setSaving(true); setMessage("");
    const data=Object.fromEntries(new FormData(e.currentTarget).entries());
    const res=await fetch("/api/beginner/decision",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(data)});
    const json=await res.json().catch(()=>({})); setSaving(false);
    setMessage(res.ok?"Decisión guardada en tu bitácora privada.":(json.error??"No se pudo guardar."));
  }
  return <form className="panel beginner-form" onSubmit={submit}>
    <div className="beginner-field"><label htmlFor="decision-title">Título</label><input id="decision-title" name="title" maxLength={120} placeholder="Ej. Comparar VWRA y FWRA" required /></div>
    <div className="beginner-grid-2">
      <label className="beginner-field">Monto considerado<input name="amount" type="number" min="0" step="0.01" /></label>
      <label className="beginner-field">Moneda<select name="currency"><option value="PEN">PEN</option><option value="USD">USD</option></select></label>
    </div>
    <label className="beginner-field">¿Por qué lo consideras?<textarea name="thesis" maxLength={2000} rows={5} placeholder="Qué objetivo intenta resolver y qué entendiste."></textarea></label>
    <label className="beginner-field">Riesgos que entiendes<textarea name="risks" maxLength={2000} rows={5} placeholder="Qué podría salir mal o qué pérdida temporal aceptarías."></textarea></label>
    <label className="beginner-field">Alternativas consideradas<textarea name="alternatives" maxLength={2000} rows={4}></textarea></label>
    <label className="beginner-field">Dudas pendientes<textarea name="doubts" maxLength={2000} rows={4}></textarea></label>
    <div className="beginner-actions"><button className="primary-button" disabled={saving}>{saving?"Guardando…":"Guardar decisión"}</button>{message&&<span className="form-message" role="status">{message}</span>}</div>
  </form>;
}
