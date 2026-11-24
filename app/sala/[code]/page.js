"use client";
import {Fragment,useCallback,useEffect,useRef,useState} from "react";
import {useParams,useRouter} from "next/navigation";
import {QRCodeSVG} from "qrcode.react";
import {sb,ensureUser} from "@/lib/supabase";
import {Portrait} from "@/lib/Portrait";
import {sfx,musicOn,musicOff,unlock,speak} from "@/lib/sound";
import {CATS,SUSPECTS,WEAPONS,ROOMS,MARKS,COLORS,MIN_PLAYERS,ICONS} from "@/lib/data";

const MC=["text-stone-600","text-green-400","text-red-500","text-gold"];
const EMOJIS=["👀","😱","🔍","🤔","😏","👏"];
async function call(path,body){
  const {data:{session}}=await sb.auth.getSession();
  const r=await fetch(path,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`},body:JSON.stringify(body)});
  const j=await r.json();if(!r.ok)throw new Error(j.error||"Error");return j;
}
function Confetti(){
  const [a]=useState(()=>Array.from({length:70},(_,i)=>({l:Math.random()*100,d:Math.random()*2,t:2.5+Math.random()*2.5,c:["#c9a24b","#e8c766","#f5e3a1","#9b1c2e"][i%4]})));
  return <div className="pointer-events-none fixed inset-0 overflow-hidden">{a.map((x,i)=><span key={i} className="absolute h-3 w-2" style={{left:x.l+"%",top:"-5%",background:x.c,animation:`fall ${x.t}s linear ${x.d}s infinite`}}/>)}</div>;
}
const Dot=({c})=><Portrait c={c} size={30}/>;
function Face({kind,name,delay=0}){
  const bf={backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden"};
  return(
    <div style={{perspective:700,width:96,height:140}}>
      <div style={{position:"relative",width:"100%",height:"100%",transformStyle:"preserve-3d",animation:`flipin .8s ${delay}s both`}}>
        <div style={bf} className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl border border-gold bg-coal p-1 text-center shadow-[0_0_20px_rgba(201,162,75,.35)]">
          {kind==="s"?<Portrait c={name} size={64}/>:<span className="text-5xl">{ICONS[name]}</span>}
          <span className="text-[11px] leading-tight text-gold">{name}</span>
        </div>
        <div style={{...bf,transform:"rotateY(180deg)"}} className="absolute inset-0 flex items-center justify-center rounded-xl border border-gold bg-gradient-to-b from-wine to-ink font-serif text-4xl text-gold">?</div>
      </div>
    </div>
  );
}
function QuestionAnim({q,from,to,onClose}){
  return(
    <div onClick={onClose} className="fixed inset-0 z-[65] flex flex-col items-center justify-center gap-6 p-4 text-center" style={{background:"radial-gradient(circle at 50% 35%,rgba(201,162,75,.25),rgba(0,0,0,.95) 60%)"}}>
      <p className="fade font-serif text-xl text-gold"><b>{from}</b> pregunta a <b>{to}</b></p>
      <div className="flex gap-3"><Face kind="s" name={q.suspect} delay={0.6}/><Face kind="w" name={q.weapon} delay={1.6}/><Face kind="r" name={q.room} delay={2.6}/></div>
      <p className="max-w-xs font-serif text-lg" style={{animation:"up .6s 3.5s both"}}>¿Fue {q.suspect}, con {q.weapon}, en {q.room}?</p>
    </div>
  );
}
function Rain(){
  const [d]=useState(()=>Array.from({length:45},()=>({l:Math.random()*100,t:0.7+Math.random()*0.8,dl:Math.random()*2})));
  return <div className="rain pointer-events-none fixed inset-0 z-0 overflow-hidden">{d.map((x,i)=><span key={i} className="absolute top-0 h-10 w-px" style={{left:x.l+"%",background:"linear-gradient(transparent,rgba(186,214,255,.35))",animation:`rain ${x.t}s linear ${x.dl}s infinite`}}/>)}</div>;
}
function Triple({v,set}){
  return <>{[["suspect","Sospechoso",SUSPECTS],["weapon","Arma",WEAPONS],["room","Habitación",ROOMS]].map(([k,l,o])=>(
    <select key={k} className="inp" value={v[k]} onChange={e=>set({...v,[k]:e.target.value})}><option value="">{l}…</option>{o.map(x=><option key={x}>{x}</option>)}</select>))}</>;
}
const full=v=>v&&v.suspect&&v.weapon&&v.room;
const EMPTY={suspect:"",weapon:"",room:""};

export default function Sala(){
  const code=String(useParams().code).toUpperCase();const router=useRouter();
  const [uid,setUid]=useState(null),[room,setRoom]=useState(null),[players,setPlayers]=useState([]),[qs,setQs]=useState([]),[ans,setAns]=useState({});
  const [notes,setNotes]=useState({c:{},t:{}}),[msg,setMsg]=useState(""),[info,setInfo]=useState(""),[tab,setTab]=useState("sala");
  const [ready,setReady]=useState(false),[busy,setBusy]=useState(false),[acc,setAcc]=useState(null),[env,setEnv]=useState(null);
  const [askTo,setAskTo]=useState(""),[askCards,setAskCards]=useState(EMPTY),[reply,setReply]=useState(""),[toast,setToast]=useState(null),[fly,setFly]=useState([]);
  const [name,setName]=useState(""),[chr,setChr]=useState("");
  const [sound,setSound]=useState(true),[music,setMusic]=useState(false),[voice,setVoice]=useState(true),[rain,setRain]=useState(true),[qAnim,setQAnim]=useState(null),[flash,setFlash]=useState(false);
  const seenQ=useRef(null);
  const prevStatus=useRef(null);
  const play=n=>{if(sound)sfx[n]();};
  const seen=useRef(null),timer=useRef(null),chRef=useRef(null),lastReact=useRef(0);

  const refresh=useCallback(async()=>{
    const [r,p,q,a]=await Promise.all([
      sb.from("rooms").select("*").eq("code",code).maybeSingle(),
      sb.from("players").select("*").eq("room_code",code).order("joined_at"),
      sb.from("questions").select("*").eq("room_code",code).order("created_at"),
      sb.from("answers").select("question_id,text").eq("room_code",code)]);
    setRoom(r.data);setPlayers(p.data||[]);setQs(q.data||[]);
    if(seenQ.current===null)seenQ.current=(q.data||[]).slice(-1)[0]?.id||0;
    setAns(Object.fromEntries((a.data||[]).map(x=>[x.question_id,x.text])));
  },[code]);

  useEffect(()=>{
    let ch;
    (async()=>{
      try{
        const s=await ensureUser();setUid(s.user.id);await refresh();setReady(true);
        const pc=(table,f)=>[ "postgres_changes",{event:"*",schema:"public",table,filter:f},refresh];
        ch=sb.channel("r-"+code,{config:{broadcast:{self:true}}})
          .on(...pc("rooms",`code=eq.${code}`)).on(...pc("players",`room_code=eq.${code}`))
          .on(...pc("questions",`room_code=eq.${code}`)).on(...pc("answers",`room_code=eq.${code}`))
          .on("broadcast",{event:"react"},({payload})=>{
            const id=Math.random();setFly(f=>[...f,{...payload,id,l:8+Math.random()*80}]);
            setTimeout(()=>setFly(f=>f.filter(x=>x.id!==id)),3200);})
          .subscribe();
        chRef.current=ch;
      }catch(e){setMsg(e.message);setReady(true);}
    })();
    return()=>{if(ch)sb.removeChannel(ch);};
  },[code,refresh]);

  const me=players.find(p=>p.id===uid);
  const isHost=room?.host_id===uid;
  const pname=id=>players.find(p=>p.id===id)?.name||"?";

  useEffect(()=>{
    if(!me)return;
    try{localStorage.setItem("tm_last",code);}catch{}
    sb.from("notes").select("data").eq("room_code",code).eq("player_id",uid).maybeSingle().then(({data})=>{if(data?.data)setNotes({c:{},t:{},...data.data});});
  },[!!me]); // eslint-disable-line
  useEffect(()=>{
    if(!me)return;
    const f=()=>call("/api/ping",{code}).catch(()=>{});f();
    const t=setInterval(f,20000);return()=>clearInterval(t);
  },[!!me]); // eslint-disable-line
  useEffect(()=>{
    if(!me||!room||room.status==="finished")return;
    const t=setInterval(()=>{
      const now=Date.now(),fresh=p=>now-new Date(p.last_seen).getTime()<60000;
      const host=players.find(p=>p.id===room.host_id);if(host&&fresh(host))return;
      const first=players.find(p=>p.id!==room.host_id&&fresh(p));
      if(first?.id===uid)call("/api/claim-host",{code}).then(refresh).catch(()=>{});
    },15000);
    return()=>clearInterval(t);
  },[players,room,me,uid]); // eslint-disable-line
  useEffect(()=>{
    const e=room?.last_event;if(!e)return;
    if(seen.current===null){seen.current=e.id;return;}
    if(e.id===seen.current)return;seen.current=e.id;
    if(e.type==="wrong"){play("wrong");if(sound)sfx.thunder();setFlash(true);setTimeout(()=>setFlash(false),900);if(voice)speak(`Acusación incorrecta. ${e.name} queda eliminado.`);setToast(e);setTimeout(()=>setToast(null),4500);}
    if(e.type==="rematch"){setNotes({c:{},t:{}});setTab("sala");setAcc(null);setEnv(null);}
  },[room]);

  const inboxId=qs.find(q=>q.to_id===uid&&!q.answered)?.id;
  useEffect(()=>{
    try{setSound(localStorage.getItem("tm_sound")!=="0");setVoice(localStorage.getItem("tm_voice")!=="0");setRain(localStorage.getItem("tm_rain")!=="0");}catch{}
    window.addEventListener("pointerdown",unlock,{once:true});
    return()=>musicOff();
  },[]);
  useEffect(()=>{
    const st=room?.status;
    if(prevStatus.current&&prevStatus.current!=="finished"&&st==="finished"){
      play(room.winner_name?"win":"wrong");
      if(voice)speak(room.winner_name?`Caso resuelto. ${room.winner_name} ha resuelto el misterio. Fue ${room.solution?.suspect}, con ${room.solution?.weapon}, en ${room.solution?.room}.`:"Caso sin resolver.");
    }
    if(st)prevStatus.current=st;
  },[room?.status]); // eslint-disable-line
  useEffect(()=>{
    if(!inboxId)return;
    try{if(navigator.vibrate)navigator.vibrate([200,100,200]);}catch{}
  },[inboxId]); // eslint-disable-line
  const lastQ=qs[qs.length-1];
  useEffect(()=>{
    if(!lastQ||seenQ.current===null||lastQ.id===seenQ.current)return;
    seenQ.current=lastQ.id;setQAnim(lastQ);play("ask");
    if(voice)speak(`${pname(lastQ.from_id)} pregunta a ${pname(lastQ.to_id)}. ¿Fue ${lastQ.suspect}, con ${lastQ.weapon}, en ${lastQ.room}?`);
    const t=setTimeout(()=>setQAnim(null),5500);return()=>clearTimeout(t);
  },[lastQ?.id]); // eslint-disable-line
  const upd=fn=>{const n=fn(notes);setNotes(n);clearTimeout(timer.current);timer.current=setTimeout(()=>sb.from("notes").upsert({room_code:code,player_id:uid,data:n}),500);};
  const act=async(path,body={},after)=>{setBusy(true);setMsg("");try{await call(path,{code,...body});if(after)after();}catch(e){setMsg(e.message);}setBusy(false);};
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
  const react=emoji=>{
    const t=Date.now();if(t-lastReact.current<1000)return;lastReact.current=t;
    chRef.current?.send({type:"broadcast",event:"react",payload:{emoji,name:me?.name||""}});
  };

  if(!ready)return <main className="p-10 text-center text-stone-400">Abriendo el expediente…</main>;
  if(!room)return <main className="mx-auto max-w-sm space-y-4 p-10 text-center"><p>{msg||`No existe la sala ${code}. Revisa el código.`}</p><button className="btn2" onClick={()=>router.push("/")}>Volver al inicio</button></main>;

  const taken=players.map(p=>p.character);
  const inbox=qs.find(q=>q.to_id===uid&&!q.answered);
  const pending=qs.some(q=>!q.answered);
  const others=players.filter(p=>p.id!==uid);
  const lobby=room.status==="lobby";

  const PlayerList=()=>(
    <ul className="space-y-2">{players.map(p=>(
      <li key={p.id} className={`flex items-center gap-3 rounded-lg border border-gold/15 bg-ink px-3 py-2 ${p.eliminated?"opacity-50 line-through":""}`}>
        <Dot c={p.character}/><span className="flex-1">{p.name}{p.id===uid&&" (tú)"}{p.id===room.host_id&&" ♛"}</span>
        <span className="text-xs text-stone-500">{p.character}</span>
        {isHost&&lobby&&p.id!==uid&&<button className="px-2 text-red-400" title="Expulsar" disabled={busy} onClick={()=>act("/api/kick",{playerId:p.id})}>✕</button>}
      </li>))}</ul>
  );
  const Qr=()=>(
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-xl bg-white p-3"><QRCodeSVG value={link||" "} size={170}/></div>
      <p className="font-serif text-4xl tracking-[0.3em] text-gold">{code}</p>
      <button className="btn2" onClick={share}>Compartir enlace</button>
    </div>
  );

  const mins=(a,b)=>Math.max(0,Math.round((new Date(b)-new Date(a))/60000));
  const fin=room.status==="finished";
  const duration=fin&&room.started_at&&room.finished_at?mins(room.started_at,room.finished_at):null;
  const askedBy=players.map(p=>({p,n:qs.filter(q=>q.from_id===p.id).length})).sort((a,b)=>b.n-a.n);
  const board=[...players].sort((a,b)=>(b.wins||0)-(a.wins||0));
  const boardCard=players.some(p=>(p.wins||0)>0)?(
    <div className="card space-y-2"><h2 className="font-serif text-lg text-gold">Marcador</h2>
      {board.map(p=><div key={p.id} className="flex items-center gap-2"><Portrait c={p.character} size={24}/><span className="flex-1">{p.name}</span><span className="text-gold">{p.wins||0}</span></div>)}</div>):null;
  return(
    <>
    {rain&&tab!=="libreta"&&<Rain/>}
    <main className={`relative z-10 mx-auto px-4 py-5 pb-24 ${tab==="libreta"?"max-w-2xl":"max-w-md"} fade`}>
      <header className="mb-2 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold tracking-widest text-gold">THE MYSTERY</h1>
        <span className="rounded border border-gold/40 px-2 py-1 text-sm tracking-widest text-gold">{code}</span>
      </header>
      <div className="mb-4 flex justify-center gap-5 text-xl">
        <button title="Sonidos" onClick={()=>{const v=!sound;setSound(v);try{localStorage.setItem("tm_sound",v?"1":"0");}catch{}unlock();}}>{sound?"🔊":"🔇"}</button>
        <button title="Música de fondo" onClick={()=>{if(music){musicOff();setMusic(false);}else{musicOn();setMusic(true);}}}><span className={music?"":"opacity-40"}>🎵</span></button>
        <button title="Voz narradora" onClick={()=>{const v=!voice;setVoice(v);try{localStorage.setItem("tm_voice",v?"1":"0");}catch{}unlock();}}><span className={voice?"":"opacity-40"}>🗣️</span></button>
        <button title="Lluvia" onClick={()=>{const v=!rain;setRain(v);try{localStorage.setItem("tm_rain",v?"1":"0");}catch{}}}><span className={rain?"":"opacity-40"}>🌧️</span></button>
      </div>
      {info&&<p className="mb-3 text-center text-sm text-gold">{info}</p>}
      {msg&&<p className="mb-3 text-center text-sm text-red-400">{msg}</p>}

      {!me&&(lobby?(
        <div className="card space-y-4">
          <h2 className="font-serif text-xl text-gold">Únete a la investigación</h2>
          <input className="inp" maxLength={20} placeholder="Tu nombre" value={name} onChange={e=>setName(e.target.value)}/>
          <div className="grid grid-cols-2 gap-2">{SUSPECTS.map(s=>(
            <button key={s} disabled={taken.includes(s)} onClick={()=>setChr(s)} className={`flex items-center gap-2 rounded-lg border px-2 py-3 text-left text-sm transition disabled:opacity-30 ${chr===s?"border-gold bg-gold/15":"border-gold/20"}`}><Dot c={s}/>{s}</button>))}</div>
          <button className="btn" disabled={busy||!name.trim()||!chr} onClick={join}>Entrar a la sala</button>
        </div>
      ):<div className="card text-center">La partida ya comenzó y no admite más jugadores.</div>)}

      {me&&lobby&&(
        <div className="space-y-5">
          <div className="card"><Qr/></div>
          <div className="card space-y-3"><h2 className="font-serif text-lg text-gold">Detectives en la sala ({players.length})</h2><PlayerList/></div>
          {boardCard}
          <div className="card space-y-3">
            <h2 className="font-serif text-lg text-gold">Sobre del misterio</h2>
            {room.has_envelope?<p className="text-green-400">✓ Sobre listo. Las 3 cartas ya se guardaron en secreto.</p>
              :<p className="text-sm text-stone-400">Alguien que no juegue debe elegir asesino, arma y habitación, y sacar esas 3 cartas del mazo.</p>}
            {isHost&&(room.has_envelope
              ?<button className="btn2" disabled={busy} onClick={()=>act("/api/envelope",{reset:true})}>Rehacer sobre</button>
              :<button className="btn2" onClick={()=>setEnv(EMPTY)}>Elegir sobre (presta tu celular)</button>)}
          </div>
          {isHost?<button className="btn" disabled={busy||players.length<MIN_PLAYERS||!room.has_envelope} onClick={()=>act("/api/start")}>
              {players.length<MIN_PLAYERS?`Faltan jugadores (mín. ${MIN_PLAYERS})`:!room.has_envelope?"Falta elegir el sobre":"Iniciar partida"}</button>
            :<p className="text-center text-sm text-stone-400">Esperando a que el anfitrión inicie la partida…</p>}
        </div>)}

      {me&&!lobby&&(<>
        <nav className="mb-4 grid grid-cols-3 gap-2">{[["sala","Sala"],["libreta","Libreta"],["preguntas","Preguntas"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} className={`rounded-lg py-2 font-serif text-sm transition ${tab===k?"bg-wine text-gold":"border border-gold/20 text-stone-400"}`}>{l}{k==="preguntas"&&inbox?" ●":""}</button>))}</nav>

        {tab==="sala"&&(
          <div className="space-y-5">
            <div className="card space-y-3"><h2 className="font-serif text-lg text-gold">Jugadores</h2><PlayerList/></div>
            <details className="card"><summary className="cursor-pointer text-gold">Invitar con QR</summary><div className="mt-4"><Qr/></div></details>
            {boardCard}
            <button className="btn" disabled={me.eliminated||room.status!=="playing"} onClick={()=>setAcc(EMPTY)}>{me.eliminated?"Estás eliminado":"Acusación final"}</button>
          </div>)}

        {tab==="preguntas"&&(
          <div className="space-y-5">
            <div className="card space-y-3">
              <h2 className="font-serif text-lg text-gold">Hacer una pregunta</h2>
              <select className="inp" value={askTo} onChange={e=>setAskTo(e.target.value)}><option value="">¿A quién?…</option>{others.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
              <Triple v={askCards} set={setAskCards}/>
              <button className="btn" disabled={busy||!askTo||!full(askCards)||pending||room.status!=="playing"} onClick={()=>act("/api/ask",{toId:askTo,...askCards},()=>{setAskCards(EMPTY);setAskTo("");})}>{pending?"Hay una pregunta sin responder":"Preguntar"}</button>
              <p className="text-xs text-stone-500">Hazla también en voz alta. Solo tú verás el texto de la respuesta.</p>
            </div>
            <div className="card space-y-3"><h2 className="font-serif text-lg text-gold">Historial</h2>
              {!qs.length&&<p className="text-sm text-stone-500">Todavía no hay preguntas.</p>}
              {[...qs].reverse().map(q=>(
                <div key={q.id} className="rounded-lg border border-gold/15 bg-ink p-3 text-sm">
                  <p><b>{pname(q.from_id)}</b> → <b>{pname(q.to_id)}</b></p>
                  <p className="text-stone-400">{q.suspect} · {q.weapon} · {q.room}</p>
                  <p className="mt-1 text-xs">{q.answered?`${pname(q.to_id)} respondió`:"Esperando respuesta…"}</p>
                  {q.from_id===uid&&ans[q.id]&&<p className="mt-2 rounded border border-gold/40 bg-gold/10 px-2 py-1 text-gold">“{ans[q.id]}”</p>}
                </div>))}
            </div>
          </div>)}

        {tab==="libreta"&&(
          <div className="space-y-3">
            <p className="text-center text-xs text-stone-400">Toca una casilla para cambiar: ○ sin marcar · ✓ confirmado · ✕ descartado · ★ posible solución. Solo tú ves esta libreta.</p>
            <div className="overflow-x-auto rounded-xl border border-gold/30">
              <table className="w-full border-collapse text-sm">
                <thead><tr className="bg-coal">
                  <th className="sticky left-0 z-10 bg-coal p-2 text-left font-serif text-gold">Carta</th>
                  {players.map(p=><th key={p.id} className="p-1 text-[11px] font-medium" style={{color:COLORS[p.character]}}><div className="flex flex-col items-center gap-0.5"><Portrait c={p.character} size={22}/>{p.id===uid?"Yo":p.name.slice(0,7)}</div></th>)}
                  <th className="p-2 text-left font-serif text-gold">Notas</th></tr></thead>
                <tbody>{CATS.map(([cat,items])=>(
                  <Fragment key={cat}>
                    <tr><td colSpan={players.length+2} className="bg-wine/50 p-2 font-serif text-xs tracking-widest text-gold">{cat}</td></tr>
                    {items.map(it=>(
                      <tr key={it} className="border-t border-gold/10">
                        <td className="sticky left-0 z-10 w-28 bg-ink p-2 text-xs">{it}</td>
                        {players.map(p=>{
                          const k=`${it}|${p.id}`;const v=notes.c[k]||0;
                          return <td key={p.id} className="text-center"><button onClick={()=>upd(n=>({...n,c:{...n.c,[k]:((n.c[k]||0)+1)%4}}))} className={`h-11 w-11 text-xl transition active:scale-90 ${MC[v]}`}>{MARKS[v]}</button></td>;
                        })}
                        <td className="p-1"><input className="w-28 min-w-[7rem] rounded border border-gold/10 bg-ink px-2 py-1 text-xs outline-none focus:border-gold" value={notes.t[it]||""} onChange={e=>upd(n=>({...n,t:{...n.t,[it]:e.target.value}}))}/></td>
                      </tr>))}
                  </Fragment>))}</tbody>
              </table>
            </div>
          </div>)}
      </>)}

      {env&&(
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/90 p-4 sm:items-center">
          <div className="card w-full max-w-sm space-y-3 fade">
            <h2 className="font-serif text-xl text-gold">Sobre del misterio</h2>
            <p className="text-sm text-stone-400">Para quien no juega: elige asesino, arma y habitación. Luego saca esas 3 cartas del mazo y guárdalas. Después de confirmar, nadie podrá verlas aquí.</p>
            <Triple v={env} set={setEnv}/>
            <button className="btn" disabled={busy||!full(env)} onClick={()=>act("/api/envelope",env,()=>setEnv(null))}>Confirmar y ocultar</button>
            <button className="btn2" onClick={()=>setEnv(null)}>Cancelar</button>
          </div>
        </div>)}

      {acc&&(
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/80 p-4 sm:items-center">
          <div className="card w-full max-w-sm space-y-3 fade">
            <h2 className="font-serif text-xl text-gold">Acusación final</h2>
            <Triple v={acc} set={setAcc}/>
            <p className="text-xs text-blood">Si te equivocas, quedas eliminado. Los demás no verán qué elegiste.</p>
            <button className="btn" disabled={busy||!full(acc)} onClick={()=>act("/api/accuse",acc,()=>setAcc(null))}>Acusar</button>
            <button className="btn2" onClick={()=>setAcc(null)}>Cancelar</button>
          </div>
        </div>)}

      {inbox&&room.status==="playing"&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="card w-full max-w-sm space-y-3 fade">
            <h2 className="font-serif text-xl text-gold">{pname(inbox.from_id)} te pregunta</h2>
            <p className="text-lg">{inbox.suspect}<br/>con {inbox.weapon}<br/>en {inbox.room}</p>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn2 !px-2 !py-2 text-sm" onClick={()=>setReply("Tengo una carta")}>Tengo una carta</button>
              <button className="btn2 !px-2 !py-2 text-sm" onClick={()=>setReply("No tengo ninguna")}>No tengo ninguna</button>
            </div>
            <input className="inp" maxLength={200} placeholder="Escribe tu respuesta" value={reply} onChange={e=>setReply(e.target.value)}/>
            <button className="btn" disabled={busy||!reply.trim()} onClick={()=>act("/api/answer",{questionId:inbox.id,text:reply},()=>setReply(""))}>Enviar respuesta</button>
          </div>
        </div>)}

      {toast&&(
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/85 p-6 text-center">
          <div className="border-4 border-blood px-6 py-4 font-serif text-3xl font-bold tracking-widest text-blood" style={{animation:"stamp .6s ease both"}}>ACUSACIÓN INCORRECTA</div>
          <p className="text-stone-300">{toast.name} queda eliminado.</p>
        </div>)}

      {room.status==="finished"&&(
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-ink/95">
          {room.winner_name&&<Confetti/>}
          {room.winner_name&&<div className="pointer-events-none absolute inset-0 overflow-hidden"><div className="absolute left-1/2 top-1/3 h-[200vmax] w-[200vmax] opacity-25" style={{transform:"translate(-50%,-50%)",background:"repeating-conic-gradient(from 0deg,#c9a24b 0 8deg,transparent 8deg 24deg)",animation:"rays 40s linear infinite",WebkitMaskImage:"radial-gradient(circle,#000 0,transparent 55%)",maskImage:"radial-gradient(circle,#000 0,transparent 55%)"}}/></div>}
          <div className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
            {room.winner_name&&<div className="text-6xl" style={{animation:"pop 1s .1s both"}}>🔍</div>}
            <h2 className="font-serif text-4xl font-bold text-gold" style={{animation:"stamp .7s .3s both"}}>{room.winner_name?"¡CASO RESUELTO!":"CASO SIN RESOLVER"}</h2>
            {room.winner_name&&<p className="fade text-xl">{room.winner_name}</p>}
            {room.solution&&<div className="flex gap-3"><Face kind="s" name={room.solution.suspect} delay={1.2}/><Face kind="w" name={room.solution.weapon} delay={2}/><Face kind="r" name={room.solution.room} delay={2.8}/></div>}
            <div className="card w-full max-w-sm space-y-2 text-left text-sm">
              <h3 className="font-serif text-lg text-gold">Resumen</h3>
              {duration!==null&&<p>Duración: {duration} min</p>}
              <p>Preguntas hechas: {askedBy.map(x=>`${x.p.name} ${x.n}`).join(" · ")}</p>
              {players.some(p=>p.eliminated_at)&&<p>Eliminados: {players.filter(p=>p.eliminated_at).map(p=>`${p.name} (min ${room.started_at?mins(room.started_at,p.eliminated_at):"?"})`).join(" · ")}</p>}
            </div>
            <div className="card w-full max-w-sm space-y-2 text-left"><h3 className="font-serif text-lg text-gold">Marcador</h3>
              {board.map(p=><div key={p.id} className="flex items-center gap-2"><Portrait c={p.character} size={24}/><span className="flex-1">{p.name}</span><span className="text-gold">{p.wins||0}</span></div>)}</div>
            {isHost?<button className="btn max-w-xs" disabled={busy} onClick={()=>act("/api/rematch")}>Revancha con los mismos jugadores</button>
              :<p className="text-sm text-stone-400">Esperando a que el anfitrión inicie la revancha…</p>}
            <button className="btn2 max-w-xs" onClick={()=>router.push("/")}>Volver al inicio</button>
          </div>
        </div>)}

      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] h-[60vh] overflow-hidden">
        {fly.map(f=><span key={f.id} className="absolute bottom-0 text-center text-4xl" style={{left:f.l+"%",animation:"float 3s ease-out forwards"}}>{f.emoji}<small className="block text-[10px] text-stone-300">{f.name}</small></span>)}
      </div>
      {me&&room.status!=="finished"&&(
        <div className="fixed bottom-3 left-1/2 z-30 flex -translate-x-1/2 gap-1 rounded-full border border-gold/30 bg-coal/95 px-3 py-1">
          {EMOJIS.map(e=><button key={e} className="p-1 text-2xl transition active:scale-125" onClick={()=>react(e)}>{e}</button>)}
        </div>)}
      {qAnim&&<QuestionAnim q={qAnim} from={pname(qAnim.from_id)} to={pname(qAnim.to_id)} onClose={()=>setQAnim(null)}/>}
      {flash&&<div className="pointer-events-none fixed inset-0 z-[80] bg-white" style={{animation:"flash .9s ease-out both"}}/>}
    </main>
    </>
  );
}
