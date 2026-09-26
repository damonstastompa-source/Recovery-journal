
function growTextArea(el){if(!el)return;el.style.height="auto";el.style.height=Math.max(el.scrollHeight,52)+"px";}
function initGrowingFields(){document.querySelectorAll(".entrybox,.focusbox,#journal,#mNotes").forEach(el=>{growTextArea(el);if(!el.dataset.growBound){el.addEventListener("input",()=>growTextArea(el));el.dataset.growBound="1";}});}
const KEY="recoveryJournalV1"; let db=JSON.parse(localStorage.getItem(KEY)||'{"days":{},"meetings":[],"templates":[],"topics":[],"cleanDate":"","name":"","friends":[],"milestones":{"30":true,"60":true,"90":true,"6m":true,"9m":true,"1y":true,"18m":true,"yearly":true},"friendRemindersEnabled":true}'); db.name=typeof db.name==="string"?db.name:""; db.friends=db.friends||[]; db.milestones=Object.assign({"30":true,"60":true,"90":true,"6m":true,"9m":true,"1y":true,"18m":true,"yearly":true},db.milestones||{}); if(typeof db.friendRemindersEnabled!=="boolean")db.friendRemindersEnabled=true; if(typeof db.chairInitialsPrompt!=="boolean")db.chairInitialsPrompt=false; if(typeof db.includeInitialsOnAttendance!=="boolean")db.includeInitialsOnAttendance=true; if(typeof db.rememberNewMeetings!=="boolean")db.rememberNewMeetings=true;
let selected=new Date(); selected.setHours(12,0,0,0); let month=new Date(selected.getFullYear(),selected.getMonth(),1);
const $=id=>document.getElementById(id), iso=d=>{const x=new Date(d);return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0")};
function persist(){localStorage.setItem(KEY,JSON.stringify(db))}
function backupPayload(){return {format:"Recovery Journal Backup",version:1,exportedAt:new Date().toISOString(),data:db}}
async function exportBackup(){
  const json=JSON.stringify(backupPayload(),null,2);
  const file=new File([json],`recovery-journal-backup-${iso(new Date())}.json`,{type:"application/json"});
  try{
    if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){await navigator.share({title:"Recovery Journal Backup",text:"Recovery Journal data backup",files:[file]});return}
  }catch(e){if(e&&e.name==="AbortError")return}
  const url=URL.createObjectURL(file),a=document.createElement("a");a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function importBackupFile(file){
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const parsed=JSON.parse(reader.result), incoming=parsed&&parsed.data?parsed.data:parsed;
      if(!incoming||typeof incoming!=="object"||typeof incoming.days!=="object"||!Array.isArray(incoming.meetings)||!Array.isArray(incoming.templates)||!Array.isArray(incoming.topics))throw new Error("Invalid backup");
      if(!confirm("Import this backup? This will replace the data currently stored in this app."))return;
      db={days:incoming.days||{},meetings:incoming.meetings||[],templates:incoming.templates||[],topics:incoming.topics||[],cleanDate:incoming.cleanDate||"",name:typeof incoming.name==="string"?incoming.name:"",friends:incoming.friends||[],milestones:Object.assign({"30":true,"60":true,"90":true,"6m":true,"9m":true,"1y":true,"18m":true,"yearly":true},incoming.milestones||{}),friendRemindersEnabled:typeof incoming.friendRemindersEnabled==="boolean"?incoming.friendRemindersEnabled:true,chairInitialsPrompt:typeof incoming.chairInitialsPrompt==="boolean"?incoming.chairInitialsPrompt:false,includeInitialsOnAttendance:typeof incoming.includeInitialsOnAttendance==="boolean"?incoming.includeInitialsOnAttendance:true,rememberNewMeetings:typeof incoming.rememberNewMeetings==="boolean"?incoming.rememberNewMeetings:true};
      persist();loadDay();cleanCounter();renderTemplates();alert("Backup imported successfully.");
    }catch(e){alert("That file is not a valid Recovery Journal backup.");}
  };
  reader.readAsText(file);
}
function fmt(d){return d.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"})}
const REFLECTIONS=[
  {principle:"Honesty",prompt:"Where can I be more honest with myself today?"},
  {principle:"Willingness",prompt:"What am I willing to do differently today?"},
  {principle:"Connection",prompt:"Who can I reach out to or connect with today?"},
  {principle:"Patience",prompt:"Where could I slow down and give myself or someone else patience?"},
  {principle:"Service",prompt:"How can I be helpful today?"},
  {principle:"Acceptance",prompt:"What am I struggling to accept right now?"},
  {principle:"Courage",prompt:"What is something I can face instead of avoid?"},
  {principle:"Open-mindedness",prompt:"What might I be willing to see differently?"},
  {principle:"Gratitude",prompt:"What is something I might overlook that I appreciate today?"},
  {principle:"Responsibility",prompt:"What is mine to take care of today?"},
  {principle:"Humility",prompt:"Where can I listen, learn, or ask for help today?"},
  {principle:"Forgiveness",prompt:"Is there something I can let go of or approach with more compassion?"},
  {principle:"Spiritual principles",prompt:"What principle do I want to practice in my actions today?"},
  {principle:"Action",prompt:"What is one positive action I can take today?"}
];
let currentReflectionIndex=0;
function chooseReflection(excludeIndex=-1){let choices=REFLECTIONS.map((_,i)=>i).filter(i=>i!==excludeIndex);return choices[Math.floor(Math.random()*choices.length)]}
function renderReflection(){let d=db.days[iso(selected)]||{};if(Number.isInteger(d.reflectionIndex)&&REFLECTIONS[d.reflectionIndex]) currentReflectionIndex=d.reflectionIndex; else currentReflectionIndex=chooseReflection(-1);let r=REFLECTIONS[currentReflectionIndex];$("reflectionPrinciple").textContent=r.principle;$("reflectionPrompt").textContent=r.prompt;$("reflectionResponse").value=d.reflectionResponse||"";growTextArea($("reflectionResponse"));}
function rerollReflection(){let next=chooseReflection(currentReflectionIndex);currentReflectionIndex=next;let r=REFLECTIONS[next];$("reflectionPrinciple").textContent=r.principle;$("reflectionPrompt").textContent=r.prompt;$("reflectionResponse").value="";growTextArea($("reflectionResponse"));}
function loadDay(){let x=db.days[iso(selected)]||{};$("dateLabel").textContent=fmt(selected);["a1","a2","a3","g1","g2","g3","focus","journal"].forEach(k=>$(k).value=x[k]||""); renderMeetings();renderFriendReminders();renderReflection();initGrowingFields()}
function saveDay(){let x=db.days[iso(selected)]||{};["a1","a2","a3","g1","g2","g3","focus","journal"].forEach(k=>x[k]=$(k).value);x.reflectionIndex=currentReflectionIndex;x.reflectionResponse=$("reflectionResponse").value;db.days[iso(selected)]=x;persist();alert("Saved locally.")}
function cleanCounter(){const name=(db.name||"").trim();const label=$("counterName");if(label)label.textContent=name?`${name}’s Recovery`:"Your Recovery";const greeting=$("personalGreeting");if(greeting){const h=new Date().getHours();const part=h<12?"Good morning":h<18?"Good afternoon":"Good evening";greeting.textContent=name?`${part}, ${name}.`:`${part}.`;$("personalGreetingSub").textContent="Take a moment to check in with yourself today."}if(!db.cleanDate){$("counter").textContent="Set your clean date";$("daysClean").textContent="Settings → My Recovery";return}let start=new Date(db.cleanDate+"T12:00:00"),now=new Date();let days=Math.max(0,Math.floor((new Date(now.getFullYear(),now.getMonth(),now.getDate())-new Date(start.getFullYear(),start.getMonth(),start.getDate()))/86400000));let y=now.getFullYear()-start.getFullYear(),m=now.getMonth()-start.getMonth(),d=now.getDate()-start.getDate();if(d<0){m--;d+=new Date(now.getFullYear(),now.getMonth(),0).getDate()}if(m<0){y--;m+=12} $("counter").textContent=`${y}y ${m}m ${d}d`;$("daysClean").textContent=`${days.toLocaleString()} days clean`}
function renderMeetings(){let arr=db.meetings.filter(x=>x.date===iso(selected));$("meetingList").innerHTML=arr.length?arr.map(x=>`<div class="meeting"><div class="row between"><strong>${esc(x.name)}</strong><span class="row meeting-actions"><button class="secondary" data-edit="${x.id}">Edit</button><button class="danger" data-del="${x.id}">Delete</button></span></div><div class="muted">${esc(x.time)} • ${esc(x.place)}</div><div class="topic">Topic: ${esc(x.topic)}</div>${x.chairInitials?`<div style="margin-top:8px"><span class="initials-badge">✍️ Chairperson initials captured</span></div>`:""}<div style="margin-top:6px">${esc(x.notes)}</div></div>`).join(""):"<p class='muted' style='margin-top:10px'>No meetings recorded.</p>";document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{if(confirm("Delete this meeting?")){db.meetings=db.meetings.filter(x=>x.id!==b.dataset.del);persist();renderMeetings()}});document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editMeeting(b.dataset.edit))}
let editingMeetingId=null; let pendingInitialsMeetingId=null;
function applyMeetingSettings(){const notesLabel=document.querySelector('#mNotes')?.previousElementSibling;const notesEl=$("mNotes");if(notesEl){notesEl.style.display="";if(notesLabel)notesLabel.style.display="";}const ids={chairInitialsPrompt:"chairInitialsPrompt",includeInitialsOnAttendance:"includeInitialsOnAttendance",rememberNewMeetings:"rememberNewMeetings"};Object.keys(ids).forEach(k=>{const el=$(ids[k]);if(el)el.checked=!!db[k]});}
function saveMeetingSettings(){db.chairInitialsPrompt=$("chairInitialsPrompt").checked;db.includeInitialsOnAttendance=$("includeInitialsOnAttendance").checked;db.rememberNewMeetings=$("rememberNewMeetings").checked;persist();applyMeetingSettings();}
function openMeetingForm(){ editingMeetingId=null; $("saveMeeting").textContent="Save meeting"; $("meetingModalTitle").textContent="🤝 Add Meeting"; $("meetingModal").classList.remove("hidden"); renderMeetingTemplates(); $("mName").focus(); }
function closeMeetingForm(){ editingMeetingId=null; $("saveMeeting").textContent="Save meeting"; $("meetingModal").classList.add("hidden"); ["mName","mTime","mPlace","mTopic","mNotes"].forEach(k=>$(k).value=""); $("meetingTemplate").value=""; }
function editMeeting(id){let x=db.meetings.find(m=>m.id===id);if(!x)return;editingMeetingId=id;renderMeetingTemplates();$("mName").value=x.name||"";$("mTime").value=x.time||"";$("mPlace").value=x.place||"";$("mTopic").value=x.topic||"";$("mNotes").value=x.notes||"";$("meetingTemplate").value="";$("saveMeeting").textContent="Save changes";$("meetingModalTitle").textContent="🤝 Edit Meeting";$("meetingModal").classList.remove("hidden");$("mName").focus();}
function renderMeetingTemplates(){let s=$("meetingTemplate");s.innerHTML='<option value="">New meeting</option>'+db.templates.map((x,i)=>`<option value="${i}">${esc(x.name)} — ${esc(x.place)} • ${esc(x.time)}</option>`).join("");let dl=$("topicList");dl.innerHTML=db.topics.map(x=>`<option value="${esc(x)}"></option>`).join("");}
function fillTemplate(){let x=db.templates[Number($("meetingTemplate").value)];if(!x)return; $("mName").value=x.name; $("mTime").value=x.time; $("mPlace").value=x.place;}
function saveMeeting(){let name=$("mName").value.trim();if(!name){alert("Enter a meeting name.");return}let place=$("mPlace").value.trim(),time=$("mTime").value.trim(),topic=$("mTopic").value.trim(),notes=$("mNotes").value.trim(),needsInitials=false;let meeting=null;if(editingMeetingId){meeting=db.meetings.find(m=>m.id===editingMeetingId);if(meeting){meeting.name=name;meeting.place=place;meeting.time=time;meeting.topic=topic;meeting.notes=notes;needsInitials=db.chairInitialsPrompt&&!meeting.chairInitials;}}else{meeting={id:crypto.randomUUID(),date:iso(selected),name,place,time,topic,notes,chairInitials:""};db.meetings.push(meeting);needsInitials=db.chairInitialsPrompt;}if(db.rememberNewMeetings&&!db.templates.some(x=>x.name===name&&x.place===place&&x.time===time))db.templates.push({name,place,time});if(topic&&!db.topics.includes(topic))db.topics.push(topic);persist();renderMeetings();closeMeetingForm();if(needsInitials){pendingInitialsMeetingId=meeting.id;setTimeout(()=>openInitialsModal(),120);}}
let initialsDrawing=false,lastPoint=null,initialsScrollY=0;function lockInitialsScreen(){initialsScrollY=window.scrollY||window.pageYOffset||0;document.documentElement.classList.add("initials-lock");document.body.classList.add("initials-lock");document.body.style.top=`-${initialsScrollY}px`;document.body.style.width="100%";document.body.style.position="fixed";document.body.style.overflow="hidden";document.documentElement.style.overflow="hidden"}function unlockInitialsScreen(){document.documentElement.classList.remove("initials-lock");document.body.classList.remove("initials-lock");document.body.style.position="";document.body.style.top="";document.body.style.width="";document.body.style.overflow="";document.documentElement.style.overflow="";window.scrollTo(0,initialsScrollY)}function resizeInitialsCanvas(){let c=$("initialsCanvas");if(!c)return;let rect=c.getBoundingClientRect(),dpr=window.devicePixelRatio||1;c.width=Math.max(1,Math.round(rect.width*dpr));c.height=Math.max(1,Math.round(rect.height*dpr));let ctx=c.getContext("2d");ctx.scale(dpr,dpr);ctx.lineCap="round";ctx.lineJoin="round";ctx.lineWidth=3;ctx.strokeStyle="#23433B";}function openInitialsModal(){let c=$("initialsCanvas");lockInitialsScreen();$("initialsModal").classList.remove("hidden");requestAnimationFrame(()=>{resizeInitialsCanvas();clearInitialsCanvas();});}function closeInitialsModal(){$("initialsModal").classList.add("hidden");pendingInitialsMeetingId=null;unlockInitialsScreen();}function clearInitialsCanvas(){let c=$("initialsCanvas"),ctx=c.getContext("2d");ctx.clearRect(0,0,c.width,c.height);initialsDrawing=false;lastPoint=null;}function pointOnCanvas(e){let c=$("initialsCanvas"),r=c.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}function startInitials(e){e.preventDefault();initialsDrawing=true;lastPoint=pointOnCanvas(e);$("initialsCanvas").setPointerCapture?.(e.pointerId)}function drawInitials(e){if(!initialsDrawing)return;e.preventDefault();let p=pointOnCanvas(e),ctx=$("initialsCanvas").getContext("2d");ctx.beginPath();ctx.moveTo(lastPoint.x,lastPoint.y);ctx.lineTo(p.x,p.y);ctx.stroke();lastPoint=p}function endInitials(){initialsDrawing=false;lastPoint=null}function saveInitials(){if(!pendingInitialsMeetingId)return;let c=$("initialsCanvas"),blank=document.createElement("canvas");blank.width=c.width;blank.height=c.height;let ctx=blank.getContext("2d");ctx.fillStyle="#FFFDF8";ctx.fillRect(0,0,blank.width,blank.height);ctx.drawImage(c,0,0);let data=blank.toDataURL("image/png");let m=db.meetings.find(x=>x.id===pendingInitialsMeetingId);if(m){m.chairInitials=data;persist();renderMeetings();}closeInitialsModal();}$("initialsCanvas").addEventListener("pointerdown",startInitials);$("initialsCanvas").addEventListener("pointermove",drawInitials);$("initialsCanvas").addEventListener("pointerup",endInitials);$("initialsCanvas").addEventListener("pointercancel",endInitials);$("initialsModal").addEventListener("touchstart",e=>e.preventDefault(),{passive:false});$("initialsModal").addEventListener("touchmove",e=>e.preventDefault(),{passive:false});$("initialsModal").addEventListener("touchend",e=>e.preventDefault(),{passive:false});$("initialsModal").addEventListener("pointermove",e=>{if(e.target!==$("initialsCanvas"))e.preventDefault()},{passive:false});$("initialsModal").addEventListener("wheel",e=>e.preventDefault(),{passive:false});$("clearInitials").onclick=clearInitialsCanvas;$("saveInitials").onclick=saveInitials;$("closeInitials").onclick=closeInitialsModal;
function parseLocalDate(v){return new Date(v+"T12:00:00");}
function dateKeyLocal(d){return iso(new Date(d.getFullYear(),d.getMonth(),d.getDate(),12));}
function milestoneDate(cleanDate,type){let d=parseLocalDate(cleanDate);if(type==="30"||type==="60"||type==="90"){d.setDate(d.getDate()+Number(type));return d}let months={"6m":6,"9m":9,"1y":12,"18m":18};if(type in months){d.setMonth(d.getMonth()+months[type]);return d}if(type==="yearly")return null;return null}
function milestoneLabel(type){return {"30":"30 days","60":"60 days","90":"90 days","6m":"6 months","9m":"9 months","1y":"1 year","18m":"18 months","yearly":"year"}[type]||type}
function friendMilestonesForDate(date){if(!db.friendRemindersEnabled)return [];let key=iso(date),out=[];for(let f of db.friends||[]){for(let type of Object.keys(db.milestones||{})){if(!db.milestones[type])continue;let md=milestoneDate(f.date,type);if(type==="yearly"){let start=parseLocalDate(f.date),cur=parseLocalDate(key);if(cur>start&&cur.getMonth()===start.getMonth()&&cur.getDate()===start.getDate()){let years=cur.getFullYear()-start.getFullYear();if(years>0)out.push({friend:f,type,years})}}else if(md&&dateKeyLocal(md)===key){out.push({friend:f,type,years:null})}}}return out}
function renderFriendReminders(){let box=$("friendReminders");let items=friendMilestonesForDate(selected);if(!items.length){box.innerHTML="";return}box.innerHTML='<div class="friend-reminder"><div class="eyebrow">RECOVERY COMMUNITY</div>'+items.map(x=>{let label=x.type==="yearly"?`${x.years} year${x.years===1?"":"s"}`:milestoneLabel(x.type);return `<div style="margin-top:8px"><strong>🎉 ${esc(x.friend.name)} — ${esc(label)} clean today!</strong><div class="muted" style="margin-top:3px">Celebrate their recovery and progress.</div></div>`}).join("")+'</div>'}
function renderFriends(){let list=$("friendsList");const count=$("friendsCount");if(count)count.textContent=db.friends.length;if(!db.friends.length){list.innerHTML="<p class='muted'>No friends added yet.</p>"}else{list.innerHTML=db.friends.map(f=>`<div class="meeting friend-row"><div><strong>${esc(f.name)}</strong><div class="muted">Clean date: ${esc(f.date)}</div></div><button class="danger" data-friend-del="${esc(f.id)}">Delete</button></div>`).join("");list.querySelectorAll("[data-friend-del]").forEach(b=>b.onclick=()=>{if(confirm("Delete this friend's clean date?")){db.friends=db.friends.filter(f=>f.id!==b.dataset.friendDel);persist();renderFriends();renderFriendReminders();renderCalendar()}})}}
function saveFriend(){let name=$("friendName").value.trim(),date=$("friendDate").value;if(!name||!date){alert("Enter a friend name and clean date.");return}if(parseLocalDate(date)>new Date()){alert("Clean date cannot be in the future.");return}db.friends.push({id:crypto.randomUUID(),name,date});persist();$("friendName").value="";$("friendDate").value="";renderFriends();renderFriendReminders();renderCalendar()}
function saveRecoverySettings(){let name=$("userName").value.trim(),v=$("cleanDate").value;if(v&&new Date(v+"T12:00:00")>new Date()){alert("Clean date cannot be in the future.");return}if(db.cleanDate&&v!==db.cleanDate&&!confirm("Change your recovery date?"))return;db.name=name;db.cleanDate=v;persist();cleanCounter();alert("Recovery settings saved locally.")}
function saveMilestoneSettings(){db.friendRemindersEnabled=$("friendRemindersEnabled").checked;document.querySelectorAll(".milestoneToggle").forEach(x=>db.milestones[x.value]=x.checked);persist();renderFriendReminders();renderCalendar()}
function renderCalendar(){let y=month.getFullYear(),m=month.getMonth();$("monthLabel").textContent=month.toLocaleDateString(undefined,{month:"long",year:"numeric"});let c=$("calendar");c.innerHTML=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(x=>`<div class="dow">${x}</div>`).join("");let first=new Date(y,m,1).getDay(),last=new Date(y,m+1,0).getDate();for(let i=0;i<first;i++)c.insertAdjacentHTML("beforeend","<div></div>");for(let d=1;d<=last;d++){let dt=new Date(y,m,d),key=iso(dt),has=!!db.days[key]||db.meetings.some(x=>x.date===key)||friendMilestonesForDate(dt).length,sel=key===iso(selected);c.insertAdjacentHTML("beforeend",`<button class="day ${has?"has":""} ${friendMilestonesForDate(dt).length?"friend-day":""} ${sel?"sel":""}" data-date="${key}">${d}</button>`)}c.querySelectorAll("[data-date]").forEach(b=>b.onclick=()=>{selected=new Date(b.dataset.date+"T12:00:00");loadDay();show("today");renderCalendar()})}
function runSearch(){let q=$("q").value.toLowerCase(),from=$("from").value,to=$("to").value;let out=[];Object.entries(db.days).forEach(([date,x])=>{if((!from||date>=from)&&(!to||date<=to)&&JSON.stringify(x).toLowerCase().includes(q))out.push({date,type:"Journal",text:x.journal||"Daily entry",x})});db.meetings.forEach(x=>{if((!from||x.date>=from)&&(!to||x.date<=to)&&JSON.stringify(x).toLowerCase().includes(q))out.push({date:x.date,type:"Meeting",text:`${x.name} — ${x.topic}`,x})});$("results").innerHTML=out.length?out.sort((a,b)=>b.date.localeCompare(a.date)).map(r=>`<div class="card"><div class="muted">${r.date} • ${r.type}</div><h3>${esc(r.text)}</h3><p style="margin-top:7px">${esc(r.type==="Journal"?r.x.journal:r.x.notes)}</p></div>`).join(""):"<div class='card muted'>No matching records.</div>"}

function selectedReportFields(){
  return [...document.querySelectorAll(".reportField:checked")].map(x=>x.value);
}
function inRange(date, from, to){ return (!from||date>=from)&&(!to||date<=to); }
function dateRangeKeys(from,to){
  let start=from?new Date(from+"T12:00:00"):new Date(selected);
  let end=to?new Date(to+"T12:00:00"):new Date(start);
  if(end<start){let t=start;start=end;end=t}
  let out=[]; for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)) out.push(iso(d)); return out;
}
function escHtml(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function buildPrintReport(){
  let fields=selectedReportFields();
  let from=$("from").value, to=$("to").value;
  if(!from) from=iso(selected); if(!to) to=from;
  let keys=dateRangeKeys(from,to);
  if(!fields.length){alert("Select at least one section to print.");return false}
  let title = from===to ? new Date(from+"T12:00:00").toLocaleDateString(undefined,{month:"long",day:"numeric",year:"numeric"}) : `${new Date(from+"T12:00:00").toLocaleDateString()} – ${new Date(to+"T12:00:00").toLocaleDateString()}`;
  let out=`<div class="print-report"><h1>Recovery Journal</h1><div class="meta">${escHtml(title)}</div>`;
  keys.forEach(date=>{
    let d=db.days[date]||{}, meetings=db.meetings.filter(x=>x.date===date);
    let has = (fields.includes("affirmations")&&(d.a1||d.a2||d.a3)) || (fields.includes("gratitude")&&(d.g1||d.g2||d.g3)) || (fields.includes("reflection")&&(d.reflectionResponse||Number.isInteger(d.reflectionIndex))) || (fields.includes("journal")&&d.journal) || (fields.includes("meetings")&&meetings.length);
    if(!has) return;
    let nice=new Date(date+"T12:00:00").toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"});
    out+=`<div class="dayblock"><h2>${escHtml(nice)}</h2>`;
    if(fields.includes("affirmations")) out+=`<div><h2>Positive Affirmations</h2>${[d.a1,d.a2,d.a3].filter(Boolean).map((x,i)=>`<div class="item"><span class="label">${i+1}.</span> ${escHtml(x)}</div>`).join("")||'<div class="meta">None recorded.</div>'}</div>`;
    if(fields.includes("gratitude")) out+=`<div><h2>Three Things I'm Grateful For</h2>${[d.g1,d.g2,d.g3].filter(Boolean).map((x,i)=>`<div class="item"><span class="label">${i+1}.</span> ${escHtml(x)}</div>`).join("")||'<div class="meta">None recorded.</div>'}</div>`;
    if(fields.includes("focus") && d.focus) out+=`<div><h2>Today's Focus</h2><div class="item">${escHtml(d.focus).replace(/\n/g,"<br>")}</div></div>`;
    if(fields.includes("reflection") && (d.reflectionResponse||Number.isInteger(d.reflectionIndex))){let rr=REFLECTIONS[d.reflectionIndex]||null;out+=`<div><h2>Living the Program</h2>`;if(rr)out+=`<div class="meta"><strong>${escHtml(rr.principle)}</strong> — ${escHtml(rr.prompt)}</div>`;out+=d.reflectionResponse?`<div class="item">${escHtml(d.reflectionResponse).replace(/\n/g,"<br>")}</div>`:`<div class="meta">No reflection recorded.</div>`;out+=`</div>`;}
    if(fields.includes("journal")) out+=`<div><h2>Journal</h2><div class="item">${escHtml(d.journal).replace(/\n/g,"<br>")||'<span class="meta">No journal entry.</span>'}</div></div>`;
    if(fields.includes("meetings")) out+=`<div><h2>Meetings</h2>${meetings.map(m=>`<div class="meeting"><div><span class="label">${escHtml(m.name)}</span></div><div class="meta">${escHtml(m.time)} • ${escHtml(m.place)}</div><div><span class="label">Table topic:</span> ${escHtml(m.topic)||"—"}</div><div><span class="label">Notes:</span> ${escHtml(m.notes)||"—"}</div></div>`).join("")||'<div class="meta">No meetings recorded.</div>'}</div>`;
    out+="</div>";
  });
  out+="</div>";
  $("printReportArea").innerHTML=out;
  return true;
}
function buildAllReports(){
  let dates=new Set(Object.keys(db.days));
  db.meetings.forEach(m=>dates.add(m.date));
  let keys=[...dates].sort((a,b)=>a.localeCompare(b));
  if(!keys.length){alert("There are no saved journal days or meetings to export yet.");return false}
  let out=`<div class="print-report"><h1>Recovery Journal — All Reports</h1><div class="meta">All saved records • Sorted oldest to newest • Generated ${escHtml(new Date().toLocaleString())}</div>`;
  keys.forEach(date=>{
    let d=db.days[date]||{}, meetings=db.meetings.filter(x=>x.date===date);
    let nice=new Date(date+"T12:00:00").toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"});
    out+=`<div class="dayblock"><h2>${escHtml(nice)}</h2>`;
    if(d.a1||d.a2||d.a3) out+=`<div><h2>Positive Affirmations</h2>${[d.a1,d.a2,d.a3].filter(Boolean).map((x,i)=>`<div class="item"><span class="label">${i+1}.</span> ${escHtml(x)}</div>`).join("")}</div>`;
    if(d.g1||d.g2||d.g3) out+=`<div><h2>Three Things I'm Grateful For</h2>${[d.g1,d.g2,d.g3].filter(Boolean).map((x,i)=>`<div class="item"><span class="label">${i+1}.</span> ${escHtml(x)}</div>`).join("")}</div>`;
    if(d.focus) out+=`<div><h2>Today's Focus</h2><div class="item">${escHtml(d.focus).replace(/\n/g,"<br>")}</div></div>`;
    if(d.reflectionResponse||Number.isInteger(d.reflectionIndex)){let rr=REFLECTIONS[d.reflectionIndex]||null;out+=`<div><h2>Living the Program</h2>${rr?`<div class="meta"><strong>${escHtml(rr.principle)}</strong> — ${escHtml(rr.prompt)}</div>`:""}${d.reflectionResponse?`<div class="item">${escHtml(d.reflectionResponse).replace(/\n/g,"<br>")}</div>`:""}</div>`;}
    if(d.journal) out+=`<div><h2>Journal</h2><div class="item">${escHtml(d.journal).replace(/\n/g,"<br>")}</div></div>`;
    if(meetings.length) out+=`<div><h2>Meetings</h2>${meetings.map(m=>`<div class="meeting"><div><span class="label">${escHtml(m.name)}</span></div><div class="meta">${escHtml(m.time)} • ${escHtml(m.place)}</div><div><span class="label">Table topic:</span> ${escHtml(m.topic)||"—"}</div><div><span class="label">Notes:</span> ${escHtml(m.notes)||"—"}</div></div>`).join("")}</div>`;
    out+="</div>";
  });
  out+="</div>";
  $("printReportArea").innerHTML=out;
  return true;
}
function buildMeetingAttendance(){
  let from=$("from").value, to=$("to").value;
  if(!from) from=iso(selected); if(!to) to=from;
  if(to<from){let t=from;from=to;to=t}
  let meetings=db.meetings.filter(m=>m.date>=from&&m.date<=to).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  if(!meetings.length){alert("There are no meetings in the selected date range.");return false}
  let title=from===to?new Date(from+"T12:00:00").toLocaleDateString(undefined,{month:"long",day:"numeric",year:"numeric"}):`${new Date(from+"T12:00:00").toLocaleDateString()} – ${new Date(to+"T12:00:00").toLocaleDateString()}`;
  let includeInitials=!!db.includeInitialsOnAttendance;
  let initialsHead=includeInitials?'<th class="initials">Chairperson initials</th>':'';
  let out=`<div class="print-report"><h1>Recovery Journal — Meeting Attendance</h1><div class="meta">${escHtml(title)} • ${meetings.length} meeting${meetings.length===1?"":"s"}</div><table class="attendance-sheet"><thead><tr><th>Date</th><th>Time</th><th>Meeting</th><th>Place</th><th>Table Topic</th>${initialsHead}</tr></thead><tbody>`;
  meetings.forEach(m=>{let date=new Date(m.date+"T12:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});let initials=includeInitials?(m.chairInitials?`<img class="initials-print" src="${m.chairInitials}" alt="Chairperson initials">`:'<span style="display:inline-block;min-width:82px;height:30px;border-bottom:1px solid #777"></span>'):'';out+=`<tr><td class="date">${escHtml(date)}</td><td>${escHtml(m.time)||"—"}</td><td>${escHtml(m.name)}</td><td>${escHtml(m.place)||"—"}</td><td>${escHtml(m.topic)||"—"}</td>${includeInitials?`<td class="initials">${initials}</td>`:''}</tr>`});
  out+=`</tbody></table><div class="meta" style="margin-top:12px">Meeting notes are intentionally omitted.${includeInitials?' Saved chairperson initials are included when available.':''}</div></div>`;
  $("printReportArea").innerHTML=out; return true;
}
function openPrintWindow(){
  const area=document.getElementById("printReportArea");
  if(!area || !area.innerHTML.trim()){alert("Nothing to print yet.");return}
  let modal=document.getElementById("printPreviewModal");
  if(!modal){
    modal=document.createElement("div");
    modal.id="printPreviewModal";
    modal.innerHTML=`<div class="print-preview-sheet"><div class="print-preview-actions"><button type="button" id="closePrintPreview" class="secondary">Back</button><button type="button" id="confirmPrintPreview" class="primary">Print / Save PDF</button></div><div id="printPreviewContent"></div></div>`;
    document.body.appendChild(modal);
    document.getElementById("closePrintPreview").onclick=closePrintPreview;
    document.getElementById("confirmPrintPreview").onclick=()=>{
      document.body.classList.add("printing-recovery-journal");
      window.print();
    };
  }
  document.getElementById("printPreviewContent").innerHTML=area.innerHTML;
  modal.classList.add("open");
  document.body.classList.add("print-preview-open");
}
function closePrintPreview(){
  const modal=document.getElementById("printPreviewModal");
  if(modal) modal.classList.remove("open");
  document.body.classList.remove("print-preview-open","printing-recovery-journal");
}
window.addEventListener("afterprint",()=>document.body.classList.remove("printing-recovery-journal"));
function printMeetingAttendance(){if(buildMeetingAttendance())openPrintWindow()}
function printAllReports(){if(buildAllReports())openPrintWindow()}
function printReport(){if(buildPrintReport())openPrintWindow()}

function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function renderMeetingsTab(){
  let today=iso(selected);
  let todayArr=db.meetings.filter(m=>m.date===today).sort((a,b)=>(a.time||"").localeCompare(b.time||""));
  let recent=[...db.meetings].sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)).slice(0,12);
  $("meetingsTodayHeading").textContent=new Date(today+"T12:00:00").toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"})+" — Meetings";
  const card=(m,showDate)=>`<div class="meeting"><div class="row between"><strong>${esc(m.name)}</strong><span class="row meeting-actions"><button class="secondary" data-mtab-edit="${m.id}">Edit</button><button class="danger" data-mtab-del="${m.id}">Delete</button></span></div><div class="muted">${showDate?esc(new Date(m.date+"T12:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}))+" • ":""}${esc(m.time)||"—"} • ${esc(m.place)||"—"}</div><div class="topic">Topic: ${esc(m.topic)||"—"}</div>${m.notes?`<div style="margin-top:6px">${esc(m.notes)}</div>`:""}${m.chairInitials?`<div style="margin-top:8px"><span class="initials-badge">✍️ Chairperson initials captured</span></div>`:""}</div>`;
  $("meetingsTodayList").innerHTML=todayArr.length?todayArr.map(m=>card(m,false)).join(""):"<p class='muted'>No meetings recorded for this day.</p>";
  $("recentMeetingsList").innerHTML=recent.length?recent.map(m=>card(m,true)).join(""):"<p class='muted'>No meetings recorded yet.</p>";
  $("meetingsQuickList").innerHTML=db.templates.length?db.templates.map((x,i)=>`<button class="secondary" style="width:100%;margin-top:7px;text-align:left" data-quick-mtab="${i}">${esc(x.name)}<br><span class="muted">${esc(x.place)} • ${esc(x.time)}</span></button>`).join(""):"<p class='muted'>Your saved meetings will appear here after you enter them.</p>";
  document.querySelectorAll("[data-mtab-edit]").forEach(b=>b.onclick=()=>{show("today");editMeeting(b.dataset.mtabEdit)});
  document.querySelectorAll("[data-mtab-del]").forEach(b=>b.onclick=()=>{if(confirm("Delete this meeting?")){db.meetings=db.meetings.filter(x=>x.id!==b.dataset.mtabDel);persist();renderMeetings();renderMeetingsTab()}});
  document.querySelectorAll("[data-quick-mtab]").forEach(b=>b.onclick=()=>{show("today");openMeetingForm();setTimeout(()=>{$("meetingTemplate").value=b.dataset.quickMtab;fillTemplate()},0)});
}
function show(tab){["today","calendar","meetings","search","settings"].forEach(x=>$(x+"View").classList.toggle("hidden",x!==tab));if(tab==="search"){$("from").value=iso(selected);$("to").value=iso(selected)}document.querySelectorAll(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));if(tab==="calendar")renderCalendar();if(tab==="meetings")renderMeetingsTab();if(tab==="settings"){$("userName").value=db.name||"";$("cleanDate").value=db.cleanDate;renderTemplates();renderFriends();$("friendRemindersEnabled").checked=db.friendRemindersEnabled;document.querySelectorAll(".milestoneToggle").forEach(x=>x.checked=!!db.milestones[x.value]);applyMeetingSettings()}}
function renderTemplates(){$("templates").innerHTML=db.templates.length?db.templates.map(x=>`<div class="meeting"><strong>${esc(x.name)}</strong><div class="muted">${esc(x.place)} • ${esc(x.time)}</div></div>`).join(""):"<p class='muted'>Templates appear automatically as you enter meetings.</p>"}
document.querySelectorAll(".nav button").forEach(b=>b.onclick=()=>show(b.dataset.tab));
$("meetingsAddBtn").onclick=()=>{show("today");openMeetingForm()};$("meetingsTodayBtn").onclick=()=>{selected=new Date();selected.setHours(12,0,0,0);loadDay();show("meetings")};$("meetingsAttendanceBtn").onclick=printMeetingAttendance;
$("addFriend").onclick=saveFriend;$("friendRemindersEnabled").onchange=saveMilestoneSettings;document.querySelectorAll(".milestoneToggle").forEach(x=>x.onchange=saveMilestoneSettings);
$("printAllReports").onclick=printAllReports;$("printMeetingAttendance").onclick=printMeetingAttendance;$('chairInitialsPrompt').onchange=saveMeetingSettings;$('includeInitialsOnAttendance').onchange=saveMeetingSettings;$('rememberNewMeetings').onchange=saveMeetingSettings;
$("exportBackup").onclick=exportBackup;
$("importBackup").onclick=()=>$("backupFile").click();
$("backupFile").onchange=e=>{importBackupFile(e.target.files[0]);e.target.value=""};$("todayBtn").onclick=()=>{selected=new Date();selected.setHours(12,0,0,0);loadDay()};$("prevDay").onclick=()=>{selected.setDate(selected.getDate()-1);loadDay()};$("nextDay").onclick=()=>{selected.setDate(selected.getDate()+1);loadDay()};$("saveDay").onclick=saveDay;$("rerollReflection").onclick=rerollReflection;$("addMeeting").onclick=openMeetingForm;$("meetingTemplate").onchange=fillTemplate;$("closeMeetingModal").onclick=closeMeetingForm;$("saveMeeting").onclick=saveMeeting;$("cancelMeeting").onclick=closeMeetingForm;$("prevMonth").onclick=()=>{month.setMonth(month.getMonth()-1);renderCalendar()};$("nextMonth").onclick=()=>{month.setMonth(month.getMonth()+1);renderCalendar()};$("runSearch").onclick=runSearch;$("printReport").onclick=printReport;$("setWholeDay").onclick=()=>document.querySelectorAll(".reportField").forEach(x=>x.checked=true);$("clearFields").onclick=()=>document.querySelectorAll(".reportField").forEach(x=>x.checked=false);$("settingsBtn").onclick=()=>show("settings");$("saveRecoverySettings").onclick=saveRecoverySettings;loadDay();initGrowingFields();cleanCounter();setInterval(cleanCounter,60000);
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js");
