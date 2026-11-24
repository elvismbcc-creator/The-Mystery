import {admin,ctx,fail,ok} from "@/lib/admin";
export async function POST(req){
  const c=await ctx(req);if(c.err)return c.err;const {u,room}=c;
  if(room.host_id!==u.id)return fail("Solo el anfitrión",403);
  if(room.status!=="finished")return fail("La partida no ha terminado");
  const code=room.code;
  await admin.from("questions").delete().eq("room_code",code);
  await admin.from("secrets").delete().eq("room_code",code);
  await admin.from("notes").delete().eq("room_code",code);
  await admin.from("players").update({eliminated:false,eliminated_at:null}).eq("room_code",code);
  await admin.from("rooms").update({status:"lobby",started_at:null,finished_at:null,has_envelope:false,winner_name:null,solution:null,last_event:{id:Date.now(),type:"rematch"}}).eq("code",code);
  return ok();
}
