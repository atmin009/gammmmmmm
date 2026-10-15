export const CATEGORIES:Record<string,string[][]>={
animals:[['แมว','เสือ'],['สุนัข','หมาป่า'],['โลมา','ฉลาม'],['เป็ด','ห่าน'],['ผีเสื้อ','แมลงปอ'],['ม้า','ม้าลาย'],['กบ','คางคก'],['สิงโต','เสือดาว'],['หมึก','แมงกะพรุน'],['กระต่าย','กระรอก']],
food:[['ส้มตำ','ยำ'],['ชาไทย','ชานม'],['ข้าวผัด','ข้าวคลุกกะปิ'],['พิซซ่า','แซนด์วิช'],['ไอศกรีม','บิงซู'],['ราเมง','ก๋วยเตี๋ยว'],['ครัวซองต์','โดนัท'],['หมูกระทะ','ชาบู'],['แตงโม','แคนตาลูป'],['ต้มยำ','ต้มข่า']],
places:[['ทะเล','สระว่ายน้ำ'],['โรงเรียน','มหาวิทยาลัย'],['โรงพยาบาล','คลินิก'],['สนามบิน','สถานีรถไฟ'],['โรงหนัง','โรงละคร'],['สวนสัตว์','ซาฟารี'],['คาเฟ่','ร้านอาหาร'],['ห้าง','ตลาด'],['ภูเขา','น้ำตก'],['ห้องสมุด','ร้านหนังสือ']],
jobs:[['หมอ','พยาบาล'],['ครู','ติวเตอร์'],['ตำรวจ','ทหาร'],['นักร้อง','นักแสดง'],['เชฟ','คนทำขนม'],['นักบิน','แอร์โฮสเตส'],['ช่างภาพ','ผู้กำกับ'],['สถาปนิก','วิศวกร'],['นักเขียน','นักข่าว'],['ช่างตัดผม','ช่างแต่งหน้า']],
things:[['โทรศัพท์','แท็บเล็ต'],['ดินสอ','ปากกา'],['หมอน','ผ้าห่ม'],['จักรยาน','มอเตอร์ไซค์'],['รองเท้า','รองเท้าแตะ'],['นาฬิกา','กำไล'],['แก้ว','ขวด'],['ร่ม','เสื้อกันฝน'],['พัดลม','แอร์'],['กล้อง','กล้องส่องทางไกล']]};
export type Player={id:string;token:string;name:string;word?:string;spy?:boolean;vote?:string};
export type Room={id:string;host:string;count:number;spies:number;rounds:number;category:string;phase:'lobby'|'clues'|'voting'|'results';round:number;game:number;players:Player[];pair?:string[];expires:number};
const token=()=>crypto.randomUUID().replaceAll('-','');
function random(n:number){const a=new Uint32Array(1);const max=0x100000000-0x100000000%n;do{crypto.getRandomValues(a);}while(a[0]>=max);return a[0]%n;}
export function createGame(c:any):Room {
 if(!c||![c.count,c.spies,c.rounds].every(Number.isInteger)||c.count<3||c.count>30||c.spies<1||c.spies>=c.count||c.rounds<1||c.rounds>10||!Object.hasOwn(CATEGORIES,c.category))throw new Error('กรุณาตรวจสอบจำนวนผู้เล่น สปาย รอบ และหมวดหมู่');
 return {id:token(),host:token(),count:c.count,spies:c.spies,rounds:c.rounds,category:c.category,phase:'lobby',round:0,game:0,expires:Date.now()+86400000,players:Array.from({length:c.count},(_,i)=>({id:String(i+1),token:token(),name:''}))};
}
function deal(r:Room){const pairs=CATEGORIES[r.category];let choices=pairs.filter(p=>p.join('|')!==r.pair?.join('|')&&p.toReversed().join('|')!==r.pair?.join('|'));if(!choices.length)choices=pairs;const pair=[...choices[random(choices.length)]];if(random(2))pair.reverse();r.pair=pair;const indices=r.players.map((_,i)=>i);for(let i=indices.length-1;i>0;i--){const j=random(i+1);[indices[i],indices[j]]=[indices[j],indices[i]];}const spies=new Set(indices.slice(0,r.spies));r.players.forEach((p,i)=>{p.spy=spies.has(i);p.word=pair[p.spy?1:0];delete p.vote;});r.game++;r.phase='clues';r.round=1;}
export function act(r:Room,t:string,a:any){const host=t===r.host,p=r.players.find(p=>p.token===t);if(!host&&!p)throw new Error('ลิงก์ไม่ถูกต้อง');if(!a||typeof a.type!=='string')throw new Error('คำสั่งไม่ถูกต้อง');
 if(a.type==='join'){if(!p||r.phase!=='lobby')throw new Error('เปลี่ยนชื่อได้ก่อนเริ่มเกมเท่านั้น');const name=typeof a.name==='string'?a.name.trim():'';if(!name||name.length>24)throw new Error('ใส่ชื่อ 1–24 ตัวอักษร');if(r.players.some(x=>x.id!==p.id&&x.name===name))throw new Error('ชื่อนี้มีคนใช้แล้ว');p.name=name;return;}
 if(a.type==='vote'){if(!p||r.phase!=='voting'||p.vote)throw new Error('ยังโหวตไม่ได้ หรือคุณโหวตไปแล้ว');if(a.target===p.id||!r.players.some(x=>x.id===a.target))throw new Error('เลือกผู้เล่นคนอื่น');p.vote=a.target;if(r.players.every(x=>x.vote))r.phase='results';return;}
 if(!host)throw new Error('เฉพาะหัวหน้าห้อง');
 if(a.type==='start'&&r.phase==='lobby'){if(r.players.some(p=>!p.name))throw new Error('รอให้ทุกคนใส่ชื่อก่อนเริ่มเกม');deal(r);return;}
 if(a.type==='restart'&&r.phase==='results'){deal(r);return;}
 if(a.type==='next'&&r.phase==='clues'){if(r.round<r.rounds)r.round++;else r.phase='voting';return;}
 throw new Error('คำสั่งนี้ใช้ไม่ได้ในช่วงนี้');
}
export function view(r:Room,t:string):any{const host=t===r.host,p=r.players.find(p=>p.token===t);if(!host&&!p)throw new Error('ลิงก์ไม่ถูกต้อง');return {id:r.id,isHost:host,count:r.count,spies:r.spies,rounds:r.rounds,category:r.category,phase:r.phase,round:r.round,game:r.game,expires:r.expires,me:p?{id:p.id,name:p.name,vote:p.vote}:undefined,word:p&&r.phase!=='lobby'?p.word:undefined,players:r.players.map(x=>({id:x.id,name:x.name,ready:!!x.name,voted:!!x.vote,...(host?{token:x.token}:{}),...(r.phase==='results'?{spy:x.spy,word:x.word,votes:r.players.filter(y=>y.vote===x.id).length}:{})})),...(r.phase==='results'?{pair:r.pair}:{})};}
