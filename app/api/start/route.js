import {admin,ctx,fail,ok} from "@/lib/admin";
import {MIN_PLAYERS} from "@/lib/data";
export async function POST(req){
  const c=await ctx(req);if(c.err)return c.err;const {u,room}=c;
  if(room.host_id!==u.id)return fail("Solo el anfitrión puede iniciar",403);
  if(room.status!=="lobby")return fail("La partida ya comenzó");
  if(!room.has_envelope)return fail("Falta elegir el sobre");
  const {count}=await admin.from("players").select("id",{count:"exact",head:true}).eq("room_code",room.code);
  if((count||0)<MIN_PLAYERS)return fail(`Se necesitan al menos ${MIN_PLAYERS} jugadores`);
  await admin.from("rooms").update({status:"playing",started_at:new Date().toISOString(),finished_at:null,last_event:{id:Date.now(),type:"start"}}).eq("code",room.code);
  return ok();
}
