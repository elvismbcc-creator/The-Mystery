import {admin,ctx,fail,ok} from "@/lib/admin";
export async function POST(req){
  const c=await ctx(req);if(c.err)return c.err;const {u,room,me}=c;
  if(!me)return fail("No estás en la sala",403);
  await admin.from("players").update({last_seen:new Date().toISOString()}).eq("room_code",room.code).eq("id",u.id);
  return ok();
}
