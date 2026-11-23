import {createClient} from "@supabase/supabase-js";
import {NextResponse} from "next/server";
export const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
export const fail=(error,status=400)=>NextResponse.json({error},{status});
export const ok=(o={})=>NextResponse.json({ok:true,...o});
export async function ctx(req){
  const t=(req.headers.get("authorization")||"").replace("Bearer ","");
  const {data}=await admin.auth.getUser(t);const u=data?.user;
  if(!u)return {err:fail("No autorizado",401)};
  const body=await req.json();
  const {data:room}=await admin.from("rooms").select("*").eq("code",body.code).maybeSingle();
  if(!room)return {err:fail("La sala no existe",404)};
  const {data:me}=await admin.from("players").select("*").eq("room_code",body.code).eq("id",u.id).maybeSingle();
  return {u,body,room,me};
}
