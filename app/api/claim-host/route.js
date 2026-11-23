import {admin,ctx,fail,ok} from "@/lib/admin";
export async function POST(req){
  const c=await ctx(req);if(c.err)return c.err;const {u,room,me}=c;
  if(!me)return fail("No estás en la sala",403);
  const {data:ps}=await admin.from("players").select("*").eq("room_code",room.code).order("joined_at");
  const fresh=p=>Date.now()-new Date(p.last_seen).getTime()<60000;
  const host=ps.find(p=>p.id===room.host_id);
  if(host&&fresh(host))return fail("El anfitrión sigue conectado");
  const first=ps.find(p=>p.id!==room.host_id&&fresh(p));
  if(!first||first.id!==u.id)return fail("No te corresponde");
  await admin.from("rooms").update({host_id:u.id}).eq("code",room.code);
  return ok();
}
