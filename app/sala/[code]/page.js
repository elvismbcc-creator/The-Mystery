"use client";
import {Fragment,useCallback,useEffect,useRef,useState} from "react";
import {useParams,useRouter} from "next/navigation";
import {QRCodeSVG} from "qrcode.react";
import {sb,ensureUser} from "@/lib/supabase";
import {CATS,SUSPECTS,WEAPONS,ROOMS,MARKS,COLORS,MIN_PLAYERS} from "@/lib/data";

const MC=["text-stone-600","text-green-400","text-red-500","text-gold"];
async function call(path,body){
  const {data:{session}}=await sb.auth.getSession();
  const r=await fetch(path,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`},body:JSON.stringify(body)});
  const j=await r.json();if(!r.ok)throw new Error(j.error||"Error");return j;
}
function Confetti(){
  const [a]=useState(()=>Array.from({length:70},(_,i)=>({l:Math.random()*100,d:Math.random()*2,t:2.5+Math.random()*2.5,c:["#c9a24b","#e8c766","#f5e3a1","#9b1c2e"][i%4]})));
  return <div className="pointer-events-none fixed inset-0 overflow-hidden">{a.map((x,i)=><span key={i} className="absolute h-3 w-2" style={{left:x.l+"%",top:"-5%",background:x.c,animation:`fall ${x.t}s linear ${x.d}s infinite`}}/>)}</div>;
}
const Dot=({c})=><span className="inline-block h-3 w-3 rounded-full" style={{background:COLORS[c]}}/>;

export default function Sala(){
  const code=String(useParams().code).toUpperCase();const router=useRouter();
  const [uid,setUid]=useState(null),[room,setRoom]=useState(null),[players,setPlayers]=useState([]),[hand,setHand]=useState([]);
  const [notes,setNotes]=useState({c:{},t:{}}),[msg,setMsg]=useState(""),[info,setInfo]=useState(""),[tab,setTab]=useState("sala");
  const [ready,setReady]=useState(false),[busy,setBusy]=useState(false),[acc,setAcc]=useState(null),[toast,setToast]=useState(null);
  const [name,setName]=useState(""),[chr,setChr]=useState("");
  const seen=useRef(null),timer=useRef(null);

  const refresh=useCallback(async()=>{
    const [r,p]=await Promise.all([sb.from("rooms").select("*").eq("code",code).maybeSingle(),sb.from("players").select("*").eq("room_code",code).order("joined_at")]);
    setRoom(r.data);setPlayers(p.data||[]);
  },[code]);

  useEffect(()=>{
    let ch;
    (async()=>{
      try{
        const s=await ensureUser();setUid(s.user.id);await refresh();setReady(true);
        ch=sb.channel("r-"+code)
          .on("postgres_changes",{event:"*",schema:"public",table:"rooms",filter:`code=eq.${code}`},refresh)
          .on("postgres_changes",{event:"*",schema:"public",table:"players",filter:`room_code=eq.${code}`},refresh)
          .subscribe();
      }catch(e){setMsg(e.message);setReady(true);}
    })();
    return()=>{if(ch)sb.removeChannel(ch);};
  },[code,refresh]);

  const me=players.find(p=>p.id===uid);

  useEffect(()=>{
    if(!me)return;
    sb.from("notes").select("data").eq("room_code",code).eq("player_id",uid).maybeSingle().then(({data})=>{if(data?.data)setNotes({c:{},t:{},...data.data});});
  },[!!me]); // eslint-disable-line
  useEffect(()=>{
    if(!me||!room||room.status==="lobby")return;
    sb.from("hands").select("cards").eq("room_code",code).eq("player_id",uid).maybeSingle().then(({data})=>setHand(data?.cards||[]));
  },[!!me,room?.status]); // eslint-disable-line
  useEffect(()=>{
    const e=room?.last_event;if(!e)return;
    if(seen.current===null){seen.current=e.id;return;}
    if(e.id!==seen.current){seen.current=e.id;if(e.type==="wrong"){setToast(e);setTimeout(()=>setToast(null),4500);}}
  },[room]);

  const upd=fn=>{
    const n=fn(notes);setNotes(n);clearTimeout(timer.current);
    timer.current=setTimeout(()=>sb.from("notes").upsert({room_code:code,player_id:uid,data:n}),500);
  };
  const join=async()=>{
    setBusy(true);setMsg("");
    const {error}=await sb.from("players").insert({id:uid,room_code:code,name:name.trim(),character:chr});
    setBusy(false);
    if(error)setMsg(error.code==="23505"?"Ese personaje ya fue elegido. Elige otro.":error.message);else refresh();
  };
  const link=typeof window!=="undefined"?`${location.origin}/sala/${code}`:"";
  const share=async()=>{
    try{if(navigator.share){await navigator.share({title:"THE MYSTERY",text:`Únete a la sala ${code}`,url:link});return;}}catch{}
    await navigator.clipboard.writeText(link);setInfo("Enlace copiado");setTimeout(()=>setInfo(""),2000);
  };
  const start=async()=>{setBusy(true);setMsg("");try{await call("/api/start",{code});}catch(e){setMsg(e.message);}setBusy(false);};
  const accuse=async()=>{setBusy(true);setMsg("");try{await call("/api/accuse",{code,...acc});setAcc(null);}catch(e){setMsg(e.message);}setBusy(false);};

  if(!ready)return <main className="p-10 text-center text-stone-400">Abriendo el expediente…</main>;
  if(!room)return <main className="mx-auto max-w-sm p-10 text-center space-y-4"><p>{msg||`No existe la sala ${code}. Revisa el código.`}</p><button className="btn2" onClick={()=>router.push("/")}>Volver al inicio</button></main>;

  const taken=players.map(p=>p.character);
  const isHost=room.host_id===uid;

  const PlayerList=()=>(
    <ul className="space-y-2">{players.map(p=>(
      <li key={p.id} className={`flex items-center gap-3 rounded-lg border border-gold/15 bg-ink px-3 py-2 ${p.eliminated?"opacity-50 line-through":""}`}>
        <Dot c={p.character}/><span className="flex-1">{p.name}{p.id===uid&&" (tú)"}{p.id===room.host_id&&" ♛"}</span><span className="text-xs text-stone-500">{p.character}</span>
      </li>))}</ul>
  );
  const Qr=()=>(
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-xl bg-white p-3"><QRCodeSVG value={link||" "} size={170}/></div>
      <p className="font-serif text-4xl tracking-[0.3em] text-gold">{code}</p>
      <button className="btn2" onClick={share}>Compartir enlace</button>
    </div>
  );

  return(
    <main className={`mx-auto px-4 py-5 ${tab==="libreta"?"max-w-2xl":"max-w-md"} fade`}>
      <header className="mb-4 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold tracking-widest text-gold">THE MYSTERY</h1>
        <span className="rounded border border-gold/40 px-2 py-1 text-sm tracking-widest text-gold">{code}</span>
      </header>
      {info&&<p className="mb-3 text-center text-sm text-gold">{info}</p>}
      {msg&&<p className="mb-3 text-center text-sm text-red-400">{msg}</p>}

      {!me&&(room.status==="lobby"?(
        <div className="card space-y-4">
          <h2 className="font-serif text-xl text-gold">Únete a la investigación</h2>
          <input className="inp" maxLength={20} placeholder="Tu nombre" value={name} onChange={e=>setName(e.target.value)}/>
          <div className="grid grid-cols-2 gap-2">{SUSPECTS.map(s=>(
            <button key={s} disabled={taken.includes(s)} onClick={()=>setChr(s)} className={`flex items-center gap-2 rounded-lg border px-2 py-3 text-left text-sm transition disabled:opacity-30 ${chr===s?"border-gold bg-gold/15":"border-gold/20"}`}><Dot c={s}/>{s}</button>))}</div>
          <button className="btn" disabled={busy||!name.trim()||!chr} onClick={join}>Entrar a la sala</button>
        </div>
      ):<div className="card text-center">La partida ya comenzó y no admite más jugadores.</div>)}

      {me&&room.status==="lobby"&&(
        <div className="space-y-5">
          <div className="card"><Qr/></div>
          <div className="card space-y-3"><h2 className="font-serif text-lg text-gold">Detectives en la sala ({players.length})</h2><PlayerList/></div>
          {isHost?<button className="btn" disabled={busy||players.length<MIN_PLAYERS} onClick={start}>{players.length<MIN_PLAYERS?`Faltan jugadores (mín. ${MIN_PLAYERS})`:"Iniciar partida"}</button>
          :<p className="text-center text-sm text-stone-400">Esperando a que el anfitrión inicie la partida…</p>}
        </div>
      )}

      {me&&room.status!=="lobby"&&(<>
        <nav className="mb-4 grid grid-cols-2 gap-2">{[["sala","Sala"],["libreta","Libreta"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} className={`rounded-lg py-2 font-serif transition ${tab===k?"bg-wine text-gold":"border border-gold/20 text-stone-400"}`}>{l}</button>))}</nav>

        {tab==="sala"&&(
          <div className="space-y-5">
            <div className="card space-y-2"><h2 className="font-serif text-lg text-gold">Tus cartas</h2>
              <div className="flex flex-wrap gap-2">{hand.map(c=><span key={c} className="rounded border border-gold/40 px-2 py-1 text-sm">{c}</span>)}</div></div>
            <div className="card space-y-3"><h2 className="font-serif text-lg text-gold">Jugadores</h2><PlayerList/></div>
            <details className="card"><summary className="cursor-pointer text-gold">Invitar con QR</summary><div className="mt-4"><Qr/></div></details>
            <button className="btn" disabled={me.eliminated||room.status!=="playing"} onClick={()=>setAcc({suspect:SUSPECTS[0],weapon:WEAPONS[0],room:ROOMS[0]})}>{me.eliminated?"Estás eliminado":"Acusación final"}</button>
          </div>)}

        {tab==="libreta"&&(
          <div className="space-y-3">
            <p className="text-center text-xs text-stone-400">Toca una casilla para cambiar: ○ sin marcar · ✓ confirmado · ✕ descartado · ★ posible solución. Solo tú ves esta libreta.</p>
            <div className="overflow-x-auto rounded-xl border border-gold/30">
              <table className="w-full border-collapse text-sm">
                <thead><tr className="bg-coal">
                  <th className="sticky left-0 z-10 bg-coal p-2 text-left font-serif text-gold">Carta</th>
                  {players.map(p=><th key={p.id} className="p-1 text-[11px] font-medium" style={{color:COLORS[p.character]}}>{p.id===uid?"Yo":p.name.slice(0,7)}</th>)}
                  <th className="p-2 text-left font-serif text-gold">Notas</th></tr></thead>
                <tbody>{CATS.map(([cat,items])=>(
                  <Fragment key={cat}>
                    <tr><td colSpan={players.length+2} className="bg-wine/50 p-2 font-serif text-xs tracking-widest text-gold">{cat}</td></tr>
                    {items.map(it=>(
                      <tr key={it} className="border-t border-gold/10">
                        <td className="sticky left-0 z-10 w-28 bg-ink p-2 text-xs">{it}</td>
                        {players.map(p=>{
                          const k=`${it}|${p.id}`;const mine=p.id===uid&&hand.includes(it);const v=mine?1:(notes.c[k]||0);
                          return <td key={p.id} className="text-center"><button disabled={mine} onClick={()=>upd(n=>({...n,c:{...n.c,[k]:((n.c[k]||0)+1)%4}}))} className={`h-11 w-11 text-xl transition active:scale-90 ${MC[v]}`}>{MARKS[v]}</button></td>;
                        })}
                        <td className="p-1"><input className="w-28 min-w-[7rem] rounded border border-gold/10 bg-ink px-2 py-1 text-xs outline-none focus:border-gold" value={notes.t[it]||""} onChange={e=>upd(n=>({...n,t:{...n.t,[it]:e.target.value}}))}/></td>
                      </tr>))}
                  </Fragment>))}</tbody>
              </table>
            </div>
          </div>)}
      </>)}

      {acc&&(
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/80 p-4 sm:items-center">
          <div className="card w-full max-w-sm space-y-3 fade">
            <h2 className="font-serif text-xl text-gold">Acusación final</h2>
            {[["suspect","Sospechoso",SUSPECTS],["weapon","Arma",WEAPONS],["room","Habitación",ROOMS]].map(([k,l,o])=>(
              <label key={k} className="block text-sm text-stone-400">{l}<select className="inp mt-1" value={acc[k]} onChange={e=>setAcc({...acc,[k]:e.target.value})}>{o.map(x=><option key={x}>{x}</option>)}</select></label>))}
            <p className="text-xs text-blood">Si te equivocas, quedas eliminado.</p>
            <button className="btn" disabled={busy} onClick={accuse}>Acusar</button>
            <button className="btn2" onClick={()=>setAcc(null)}>Cancelar</button>
          </div>
        </div>)}

      {toast&&(
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/85 p-6 text-center">
          <div className="border-4 border-blood px-6 py-4 font-serif text-3xl font-bold tracking-widest text-blood" style={{animation:"stamp .6s ease both"}}>ACUSACIÓN INCORRECTA</div>
          <p className="text-stone-300">{toast.name} queda eliminado.</p>
        </div>)}

      {room.status==="finished"&&(
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-ink/95 p-6 text-center">
          {room.winner_name&&<Confetti/>}
          <h2 className="font-serif text-4xl font-bold text-gold fade">{room.winner_name?"¡CASO RESUELTO!":"CASO SIN RESOLVER"}</h2>
          {room.winner_name&&<p className="text-xl">{room.winner_name}</p>}
          <div className="card text-lg">{room.solution?.suspect}<br/>con {room.solution?.weapon}<br/>en {room.solution?.room}</div>
          <button className="btn2 max-w-xs" onClick={()=>router.push("/")}>Volver al inicio</button>
        </div>)}
    </main>
  );
}
