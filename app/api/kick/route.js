import {admin,ctx,fail,ok} from "@/lib/admin";
export async function POST(req){
  const c=await ctx(req);if(c.err)return c.err;const {u,body,room}=c;
  if(room.host_id!==u.id)return fail("Solo el anfitrión",403);
  if(room.status!=="lobby")return fail("Solo se puede expulsar antes de iniciar");
  if(body.playerId===u.id)return fail("No puedes expulsarte");
  await admin.from("players").delete().eq("room_code",room.code).eq("id",body.playerId);
  return ok();
}
