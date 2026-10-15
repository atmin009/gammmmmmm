import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://127.0.0.1:5173';
async function request(body,token){const res=await fetch(base+'/api/game',{method:'POST',headers:{'content-type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});return {status:res.status,data:await res.json()};}
async function get(id,token){const res=await fetch(`${base}/api/game?room=${id}`,{headers:{Authorization:'Bearer '+token}});return {status:res.status,data:await res.json()};}
const created=await request({type:'create',count:12,spies:2,rounds:3,category:'animals'});assert.equal(created.status,200,JSON.stringify(created.data));const {id,token}=created.data;
let host=(await get(id,token)).data;const players=host.players;
for(let i=0;i<players.length;i++){const r=await request({type:'join',room:id,game:0,name:`Test ${i}`},players[i].token);assert.equal(r.status,200,JSON.stringify(r.data));}
host=(await get(id,token)).data;
const stale=await request({type:'start',room:id,game:0,version:0},token);assert.equal(stale.status,409);
let next=await request({type:'start',room:id,game:host.game,version:host.version},token);assert.equal(next.status,200);host=next.data;
assert.equal(host.phase,'clues');assert.equal(host.word,undefined);assert.equal(host.pair,undefined);
const p=(await get(id,players[0].token)).data;assert.ok(p.word);assert.equal(p.players[1].word,undefined);assert.equal(p.players[1].token,undefined);
assert.equal((await get(id,'wrong')).status,400);
assert.equal((await request({type:'next',room:id,game:host.game,version:host.version},players[0].token)).status,400);
for(let i=0;i<3;i++){assert.equal(host.round,i+1);next=await request({type:'next',room:id,game:host.game,version:host.version},token);assert.equal(next.status,200,JSON.stringify(next.data));host=next.data;}
assert.equal(host.phase,'voting');
const voting=await Promise.all(players.map(async(p,i)=>{for(let retry=0;retry<5;retry++){const r=await request({type:'vote',room:id,game:host.game,target:players[(i+1)%players.length].id},p.token);if(r.status!==409)return r;}throw Error('votes failed after retry');}));voting.forEach(r=>assert.equal(r.status,200,JSON.stringify(r.data)));
host=(await get(id,token)).data;assert.equal(host.phase,'results');assert.equal(host.players.filter(p=>p.spy).length,2);assert.equal(host.players.reduce((n,p)=>n+p.votes,0),12);assert.ok(host.pair);
const restarted=await request({type:'restart',room:id,game:host.game,version:host.version},token);assert.equal(restarted.status,200);assert.equal(restarted.data.phase,'clues');assert.equal(restarted.data.game,2);assert.ok(restarted.data.players.every(p=>!p.voted));assert.equal(restarted.data.pair,undefined);assert.equal((await request({type:'vote',room:id,game:1,target:players[1].id},players[0].token)).status,409);
console.log('PASS: full 12-player flow, 3 clue rounds, secret isolation, stale actions, concurrent votes, reveal and restart');
