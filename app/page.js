"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {sb,ensureUser} from "@/lib/supabase";
const gen=()=>Array.from({length:5},()=>"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random()*32)]).join("");
export default function Home(){
  const router=useRouter();const [code,setCode]=useState("");const [msg,setMsg]=useState("");const [busy,setBusy]=useState(false);const [last,setLast]=useState(null);
  useEffect(()=>{
    (async()=>{
      try{
        const c=localStorage.getItem("tm_last");if(!c)return;
        const s=await ensureUser();
        const [r,p]=await Promise.all([sb.from("rooms").select("status").eq("code",c).maybeSingle(),sb.from("players").select("id").eq("room_code",c).eq("id",s.user.id).maybeSingle()]);
        if(r.data&&p.data&&r.data.status!=="finished")setLast(c);
      }catch{}
    })();
  },[]);
  const create=async()=>{
    setBusy(true);setMsg("");
    try{
      const s=await ensureUser();
      for(let i=0;i<5;i++){const c=gen();const {error}=await sb.from("rooms").insert({code:c,host_id:s.user.id});if(!error){router.push(`/sala/${c}`);return;}}
      setMsg("No se pudo crear la partida. Revisa la configuración de Supabase.");
    }catch(e){setMsg(e.message);}
    setBusy(false);
  };
  return(
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6 fade">
      <div className="text-center">
        <p className="font-serif text-5xl font-bold tracking-widest text-gold">THE<br/>MYSTERY</p>
        <p className="mt-3 text-sm text-stone-400">La libreta del detective, en tu celular.</p>
      </div>
      {last&&<button className="btn" onClick={()=>router.push(`/sala/${last}`)}>Volver a tu partida ({last})</button>}
      <button className={last?"btn2":"btn"} onClick={create} disabled={busy}>Crear partida</button>
      <div className="card space-y-3">
        <input className="inp text-center text-xl uppercase tracking-[0.4em]" maxLength={5} placeholder="CÓDIGO" value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/>
        <button className="btn2" disabled={code.length<5} onClick={()=>router.push(`/sala/${code}`)}>Unirme con código</button>
      </div>
      {msg&&<p className="text-center text-sm text-red-400">{msg}</p>}
    </main>
  );
}
