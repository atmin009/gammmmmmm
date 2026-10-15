import {env} from 'cloudflare:workers';
import {createGame,act,view,type Room} from '../../../lib/game';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
function db(){if(!env.DB)throw new Error('ยังเชื่อมต่อห้องไม่ได้ กรุณาลองใหม่');return env.DB;}
async function load(id:string){const row=await db().prepare('SELECT data,version,expires FROM rooms WHERE id=?').bind(id).first<{data:string;version:number;expires:number}>();if(!row||row.expires<Date.now())throw new Error('ไม่พบห้อง หรือห้องหมดอายุแล้ว (24 ชั่วโมง)');return {room:JSON.parse(row.data) as Room,version:row.version};}
function credential(req:Request){return req.headers.get('Authorization')?.replace(/^Bearer /,'')||'';}
export async function GET(req:Request){try{const {room,version}=await load(new URL(req.url).searchParams.get('room')||'');return reply({...view(room,credential(req)),version});}catch(e){return reply({error:(e as Error).message},400);}}
export async function POST(req:Request){try{const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return reply({error:'ไม่อนุญาตคำขอจากเว็บไซต์อื่น'},403);if(Number(req.headers.get('content-length')||0)>8192)return reply({error:'ข้อมูลมากเกินไป'},413);const raw=await req.text();if(raw.length>8192)return reply({error:'ข้อมูลมากเกินไป'},413);const a=JSON.parse(raw);
 if(a.type==='create'){const room=createGame(a);await db().prepare('INSERT INTO rooms (id,data,version,expires) VALUES (?,?,0,?)').bind(room.id,JSON.stringify(room),room.expires).run();return reply({id:room.id,token:room.host});}
 const t=credential(req);for(let n=0;n<8;n++){const {room,version}=await load(a.room);view(room,t);if(a.game!==room.game)return reply({error:'เกมเปลี่ยนแล้ว กรุณาลองใหม่'},409);if(a.type!=='vote'&&a.type!=='join'&&a.version!==version)return reply({error:'สถานะห้องเปลี่ยนแล้ว กรุณาลองใหม่'},409);act(room,t,a);const result=await db().prepare('UPDATE rooms SET data=?,version=version+1 WHERE id=? AND version=?').bind(JSON.stringify(room),room.id,version).run();if(result.meta.changes)return reply({...view(room,t),version:version+1});}return reply({error:'มีหลายคนส่งพร้อมกัน กรุณาลองอีกครั้ง'},409);
 }catch(e){return reply({error:e instanceof Error?e.message:'เกิดข้อผิดพลาด กรุณาลองใหม่'},400);}}
