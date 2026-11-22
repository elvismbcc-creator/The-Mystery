import {NextResponse} from "next/server";
import {admin,userFrom} from "@/lib/admin";
import {SUSPECTS as S,WEAPONS as W,ROOMS as R,MIN_PLAYERS} from "@/lib/data";
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const fail=(error,status)=>NextResponse.json({error},{status});
export async function POST(req){
  const u=await userFrom(req);if(!u)return fail("No autorizado",401);
  const {code}=await req.json();
  const {data:room}=await admin.from("rooms").select("*").eq("code",code).maybeSingle();
  if(!room||room.host_id!==u.id)return fail("Solo el anfitrión puede iniciar",403);
  if(room.status!=="lobby")return fail("La partida ya comenzó",400);
  const {data:players}=await admin.from("players").select("id").eq("room_code",code).order("joined_at");
  if(!players||players.length<MIN_PLAYERS)return fail(`Se necesitan al menos ${MIN_PLAYERS} jugadores`,400);
  const sol={suspect:pick(S),weapon:pick(W),room:pick(R)};
  const rest=shuffle([...S,...W,...R].filter(c=>![sol.suspect,sol.weapon,sol.room].includes(c)));
  const hands=players.map(p=>({room_code:code,player_id:p.id,cards:[]}));
  rest.forEach((c,i)=>hands[i%hands.length].cards.push(c));
  await admin.from("secrets").upsert({room_code:code,...sol});
  await admin.from("hands").upsert(hands);
  await admin.from("rooms").update({status:"playing",last_event:{id:Date.now(),type:"start"}}).eq("code",code);
  return NextResponse.json({ok:true});
}
