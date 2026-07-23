// 星宸工作台 - 核心逻辑
const DB_KEY = 'starchen_workbench_v1';
const $ = (id) => document.getElementById(id);

// ---------- 存储层（多重备份） ----------
const BACKUP_KEY = 'starchen_workbench_autobak';
function load(){
  try{
    let raw = localStorage.getItem(DB_KEY);
    if(!raw){
      raw = localStorage.getItem(BACKUP_KEY);
      if(raw) console.log('从自动备份恢复数据');
    }
    if(!raw) return { tasks:[], words:[], myWords:[], studyLog:[], spends:[], virals:[], studyTime:{} };
    const parsed=JSON.parse(raw);
    if(!parsed.virals) parsed.virals=[];
    if(!parsed.studyTime) parsed.studyTime={};
    return parsed;
  }catch(e){ return { tasks:[], words:[], myWords:[], studyLog:[], spends:[], virals:[], studyTime:{} }; }
}
function save(db){
  const json=JSON.stringify(db);
  localStorage.setItem(DB_KEY, json);
  localStorage.setItem(BACKUP_KEY, json);
  try{ sessionStorage.setItem(DB_KEY, json); }catch(e){}
}
let db = load();

// ---------- 工具函数 ----------
function todayKey(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function nowTime(){ const d=new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
function monthKey(d=new Date()){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }
function toast(msg){
  const t=$('toast'); t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2000);
}
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }

// ---------- 封面页：每日正能量 ----------
const QUOTES = [
  {t:'你不必活在别人的期待里，按自己的节奏来就好。',a:'—— 致内耗的自己'},
  {t:'完成比完美重要，先做了再说。',a:'—— 行动派'},
  {t:'今天的你已经比昨天的你好了，哪怕只有一点点。',a:'—— 日拱一卒'},
  {t:'别拿别人的进度条，丈量自己的人生。',a:'—— 不比较'},
  {t:'累了就休息，不是放弃。休息也是前进的一部分。',a:'—— 松弛感'},
  {t:'允许自己偶尔摆烂，但别忘了回来。',a:'—— 真实点'},
  {t:'你担心的事，90% 不会发生。',a:'—— 统计学'},
  {t:'不是所有事都要有意义，开心本身就是意义。',a:'—— 快乐哲学'},
  {t:'与其焦虑未来，不如做好眼前这一件小事。',a:'—— 聚焦当下'},
  {t:'别人的评价是别人的事，你的人生是你的事。',a:'—— 课题分离'},
  {t:'慢一点没关系，方向对了就好。',a:'—— 长期主义'},
  {t:'你已经很努力了，对自己温柔一点。',a:'—— 自我接纳'},
  {t:'不内耗的秘诀：少想多做，做完再说。',a:'—— 执行力'},
  {t:'今天的事今天做，明天的事别提前焦虑。',a:'—— 边界感'},
  {t:'你不需要向任何人证明什么，活给自己看。',a:'—— 内核稳定'},
  {t:'允许一切发生，然后见招拆招。',a:'—— 松弛哲学'},
  {t:'别为打翻的牛奶哭泣，擦干净换一杯就是了。',a:'—— 翻篇力'},
  {t:'人生不是轨道，是旷野。',a:'—— 自由灵魂'},
  {t:'与其内耗自己，不如外耗别人（开玩笑的）。',a:'—— 幽默感'},
  {t:'今天的烦恼，睡一觉明天就好了一大半。',a:'—— 睡眠治愈'}
];
function renderCover(){
  const d=new Date();
  const wk=['日','一','二','三','四','五','六'][d.getDay()];
  $('coverDate').textContent=`${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 · 星期${wk}`;
  const idx = parseInt(localStorage.getItem('starchen_quote_idx')) || (d.getDate()%QUOTES.length);
  const q=QUOTES[idx];
  $('coverQuote').innerHTML=`<div class="q-text">${q.t}</div><span class="q-author">${q.a}</span>`;
  renderGlobalQuote();
  // 快速统计
  const today=todayKey(), mkey=monthKey();
  const tTasks=db.tasks.filter(t=>t.date===today);
  const tDone=tTasks.filter(t=>t.done).length;
  const streak=calcStreak();
  const mExp=db.spends.filter(s=>s.month===mkey&&s.type==='expense').reduce((a,s)=>a+s.amount,0);
  $('coverStats').innerHTML=`
    <div class="cover-stat">计划 <b>${tDone}/${tTasks.length}</b></div>
    <div class="cover-stat">英语 <b>${streak}</b> 天</div>
    <div class="cover-stat">本月支出 <b>¥${mExp.toFixed(0)}</b></div>
  `;
}
function renderGlobalQuote(){
  const idx=parseInt(localStorage.getItem('starchen_quote_idx'))||0;
  const q=QUOTES[idx]||QUOTES[0];
  const gt=document.getElementById('gqText');
  const ga=document.getElementById('gqAuthor');
  if(gt) gt.textContent=q.t;
  if(ga) ga.textContent=q.a;
}
function refreshQuote(){
  const cur=parseInt(localStorage.getItem('starchen_quote_idx'))||0;
  const next=(cur+1)%QUOTES.length;
  localStorage.setItem('starchen_quote_idx',next);
  const q=QUOTES[next];
  $('coverQuote').innerHTML=`<div class="q-text">${q.t}</div><span class="q-author">${q.a}</span>`;
  renderGlobalQuote();
}
// 换一句（封面按钮 + 全局按钮共用）
document.querySelector('.cover-next-quote').addEventListener('click',refreshQuote);
document.getElementById('gqRefresh').addEventListener('click',refreshQuote);
// 进入工作台按钮 → 跳到上次停留的 tab
$('coverEnter').addEventListener('click',()=>{
  const last=localStorage.getItem('starchen_last_tab')||'tasks';
  switchTab(last);
});

// ---------- Tab 切换（记忆上次位置） ----------
function switchTab(tabName, persist=true){
  // 离开英语模块 → 停止计时；进入英语 → 开始计时
  if(tabName!=='english') stopStudyTimer();
  else startStudyTimer();
  document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
  const btn=document.querySelector(`.tab[data-tab="${tabName}"]`);
  if(btn) btn.classList.add('active');
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  $(tabName).classList.add('active');
  if(tabName==='overview') renderOverview();
  if(persist) localStorage.setItem('starchen_last_tab', tabName);
  document.querySelector('.sidebar').classList.remove('open');
  $('sidebarBackdrop').classList.remove('show');
}
document.querySelectorAll('.tab').forEach(btn=>{
  btn.addEventListener('click',()=>switchTab(btn.dataset.tab));
});
// 侧边栏开关（移动端）
$('sidebarToggle').addEventListener('click',()=>{
  document.querySelector('.sidebar').classList.toggle('open');
  $('sidebarBackdrop').classList.toggle('show');
});
$('sidebarBackdrop').addEventListener('click',()=>{
  document.querySelector('.sidebar').classList.remove('open');
  $('sidebarBackdrop').classList.remove('show');
});

// ---------- 英语：单词/听力句子切换 ----------
const SENTENCE_BANK = [
  {en:"Could you do me a favor?",zh:"能帮我个忙吗？"},
  {en:"I'll get back to you on that.",zh:"这个我回头给你答复。"},
  {en:"What do you think?",zh:"你怎么看？"},
  {en:"Let's touch base tomorrow.",zh:"我们明天再沟通一下。"},
  {en:"I'm sorry, I didn't catch that.",zh:"抱歉，我没听清。"},
  {en:"Could you say that again?",zh:"能再说一遍吗？"},
  {en:"That makes sense.",zh:"有道理。"},
  {en:"I couldn't agree more.",zh:"我完全同意。"},
  {en:"Let me think about it.",zh:"让我考虑一下。"},
  {en:"How's everything going?",zh:"最近怎么样？"},
  {en:"Long time no see!",zh:"好久不见！"},
  {en:"Thanks for your help.",zh:"谢谢你的帮忙。"},
  {en:"No worries.",zh:"没关系/别客气。"},
  {en:"I appreciate it.",zh:"非常感谢。"},
  {en:"Can I ask you something?",zh:"能问你个事吗？"},
  {en:"I'm running late.",zh:"我要迟到了。"},
  {en:"Let's grab lunch sometime.",zh:"改天一起吃个饭吧。"},
  {en:"Sounds good to me.",zh:"我觉得可以。"},
  {en:"I'll keep that in mind.",zh:"我记住了。"},
  {en:"Don't worry about it.",zh:"别放在心上。"},
  {en:"What are you up to?",zh:"你在忙什么？"},
  {en:"It's totally worth it.",zh:"完全值得。"},
  {en:"I'll take care of it.",zh:"我来处理。"},
  {en:"Could you send me the details?",zh:"能把详情发我吗？"},
  {en:"Let me check and get back to you.",zh:"我确认下再回复你。"}
];
let curSentenceIdx=0;
// ---------- 自然拼读 ----------
const PHONICS_BANK = [
  {rule:'a 在重读音节',examples:['cake /keɪk/ 蛋糕','name /neɪm/ 名字','make /meɪk/ 制作'],tip:'重读音节中 a+e 结尾，a 发 /eɪ/'},
  {rule:'e 在词尾',examples:['he /hiː/ 他','she /ʃiː/ 她','we /wiː/ 我们'],tip:'词尾 e 通常发长音 /iː/'},
  {rule:'i 在重读音节',examples:['like /laɪk/ 喜欢','time /taɪm/ 时间','fine /faɪn/ 好'],tip:'i+e 结尾，i 发 /aɪ/'},
  {rule:'o 在重读音节',examples:['go /ɡoʊ/ 去','no /noʊ/ 不','home /hoʊm/ 家'],tip:'o 在开音节发 /oʊ/'},
  {rule:'oo 组合',examples:['book /bʊk/ 书','food /fuːd/ 食物','room /ruːm/ 房间'],tip:'oo 多发 /uː/，少数发 /ʊ/'},
  {rule:'ee 组合',examples:['see /siː/ 看见','tree /triː/ 树','meet /miːt/ 见面'],tip:'ee 固定发 /iː/'},
  {rule:'sh 组合',examples:['she /ʃiː/ 她','shop /ʃɒp/ 商店','fish /fɪʃ/ 鱼'],tip:'sh 固定发 /ʃ/'},
  {rule:'ch 组合',examples:['chair /tʃer/ 椅子','check /tʃek/ 检查','lunch /lʌntʃ/ 午餐'],tip:'ch 固定发 /tʃ/'},
  {rule:'th 组合',examples:['this /ðɪs/ 这个','think /θɪŋk/ 想','the /ðə/ 这'],tip:'th 发 /θ/ 或 /ð/，咬舌音'},
  {rule:'ing 结尾',examples:['going /ˈɡoʊɪŋ/ 去','doing /ˈduːɪŋ/ 做','working /ˈwɜːrkɪŋ/ 工作'],tip:'动词 ing 形式，发 /ɪŋ/'},
  {rule:'tion 结尾',examples:['station /ˈsteɪʃn/ 站','nation /ˈneɪʃn/ 国家','mention /ˈmenʃn/ 提到'],tip:'tion 固定发 /ʃn/'},
  {rule:'ed 结尾',examples:['worked /wɜːrkt/ 工作','played /pleɪd/ 玩','wanted /ˈwɒntɪd/ 想要'],tip:'ed 发 /t/ /d/ 或 /ɪd/'}
];
let curPhonicsIdx=0;
// ---------- 音标 ----------
const IPA_BANK = [
  {sym:'/iː/',type:'长元音',tip:'嘴角向两边咧，像微笑',examples:'see, he, me, tree'},
  {sym:'/ɪ/',type:'短元音',tip:'短促的 i，放松发音',examples:'sit, big, fish, this'},
  {sym:'/e/',type:'短元音',tip:'嘴巴半开，像发"诶"',examples:'bed, red, pen, ten'},
  {sym:'/æ/',type:'短元音',tip:'嘴张大，舌位低',examples:'cat, bad, map, apple'},
  {sym:'/ɑː/',type:'长元音',tip:'嘴巴张大，发"啊"',examples:'car, far, father, art'},
  {sym:'/ʌ/',type:'短元音',tip:'短促的"啊"',examples:'cup, bus, love, but'},
  {sym:'/ɔː/',type:'长元音',tip:'圆唇，发"奥"',examples:'law, saw, more, door'},
  {sym:'/uː/',type:'长元音',tip:'圆唇向前，发"乌"',examples:'food, room, blue, two'},
  {sym:'/eɪ/',type:'双元音',tip:'从 e 滑向 ɪ',examples:'day, name, say, make'},
  {sym:'/aɪ/',type:'双元音',tip:'从 a 滑向 ɪ',examples:'my, time, like, five'},
  {sym:'/oʊ/',type:'双元音',tip:'从 o 滑向 ʊ',examples:'go, no, home, so'},
  {sym:'/θ/',type:'清辅音',tip:'舌尖咬在齿间，送气',examples:'think, three, thank, mouth'},
  {sym:'/ð/',type:'浊辅音',tip:'舌尖咬在齿间，声带振动',examples:'this, that, the, they'},
  {sym:'/ʃ/',type:'清辅音',tip:'像"嘘"的音',examples:'she, ship, fish, wash'},
  {sym:'/tʃ/',type:'清辅音',tip:'t+ʃ，像"吃"',examples:'chair, check, lunch, watch'}
];
let curIpaIdx=0;

document.querySelectorAll('.et-tab').forEach(t=>{
  t.addEventListener('click',()=>{
    document.querySelectorAll('.et-tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    const mode=t.dataset.et;
    // 隐藏全部
    ['wordCard','wordControls','sentenceCard','sentenceControls','phonicsCard','phonicsControls','ipaCard','ipaControls'].forEach(id=>{$(id).style.display='none';});
    if(mode==='word'){
      $('wordCard').style.display=''; $('wordControls').style.display='';
    }else if(mode==='sentence'){
      $('sentenceCard').style.display=''; $('sentenceControls').style.display='';
      renderSentence();
    }else if(mode==='phonics'){
      $('phonicsCard').style.display=''; $('phonicsControls').style.display='';
      renderPhonics();
    }else if(mode==='ipa'){
      $('ipaCard').style.display=''; $('ipaControls').style.display='';
      renderIpa();
    }
  });
});
function renderPhonics(){
  const p=PHONICS_BANK[curPhonicsIdx];
  $('phonicsRule').textContent=p.rule;
  $('phonicsExamples').innerHTML=p.examples.map(e=>`<span class="ex">${e}</span>`).join('');
}
function renderIpa(){
  const i=IPA_BANK[curIpaIdx];
  $('ipaSymbol').textContent=i.sym;
  $('ipaType').textContent=i.type;
  $('ipaTip').textContent='💡 '+i.tip;
  $('ipaExamples').innerHTML=i.examples.split(', ').map(e=>`<span class="ex">${e}</span>`).join('');
}
$('nextPhonics').addEventListener('click',()=>{ curPhonicsIdx=(curPhonicsIdx+1)%PHONICS_BANK.length; renderPhonics(); });
$('playPhonics').addEventListener('click',()=>{
  const p=PHONICS_BANK[curPhonicsIdx];
  const words=p.examples[0].split(' ')[0];
  if('speechSynthesis' in window){
    const u=new SpeechSynthesisUtterance(words);
    u.lang='en-US'; u.rate=0.7;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }
});
$('nextIpa').addEventListener('click',()=>{ curIpaIdx=(curIpaIdx+1)%IPA_BANK.length; renderIpa(); });
$('playIpa').addEventListener('click',()=>{
  const i=IPA_BANK[curIpaIdx];
  const word=i.examples.split(', ')[0];
  if('speechSynthesis' in window){
    const u=new SpeechSynthesisUtterance(word);
    u.lang='en-US'; u.rate=0.6;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }
});
function renderSentence(){
  const s=SENTENCE_BANK[curSentenceIdx];
  $('sentenceEn').textContent=s.en;
  $('sentenceZh').textContent=s.zh;
  $('sentenceZh').style.display='none';
}
$('showZh').addEventListener('click',()=>{ $('sentenceZh').style.display='block'; });
$('nextSentence').addEventListener('click',()=>{
  curSentenceIdx=(curSentenceIdx+1)%SENTENCE_BANK.length;
  renderSentence();
});
$('playSentence').addEventListener('click',()=>{
  const s=SENTENCE_BANK[curSentenceIdx];
  if('speechSynthesis' in window){
    const u=new SpeechSynthesisUtterance(s.en);
    u.lang='en-US'; u.rate=0.9;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }else{
    toast('当前浏览器不支持语音朗读');
  }
});

// ---------- 顶部日期 ----------
function renderDate(){
  const d=new Date();
  const wk=['日','一','二','三','四','五','六'][d.getDay()];
  $('todayDate').textContent = `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 星期${wk}`;
}

// ---------- 任务管理 ----------
// 支持跨天：晚上写的计划如果 date 是"明天"，第二天仍能显示
function getEffectiveDate(){
  // 凌晨 0-4 点算前一天晚上，方便深夜写次日计划
  const d=new Date();
  if(d.getHours()<4){ d.setDate(d.getDate()-1); }
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function isFuturePlan(dateStr){
  // 判断是不是"未来的计划"（晚上写次日计划）
  const today=new Date();
  const todayStr=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  return dateStr > todayStr;
}
function renderTasks(){
  const today = todayKey();
  const yest = new Date(); yest.setDate(yest.getDate()-1);
  const yestKey=`${yest.getFullYear()}-${String(yest.getMonth()+1).padStart(2,'0')}-${String(yest.getDate()).padStart(2,'0')}`;
  // 显示今天的 + 凌晨 0-4 点也显示昨晚写的次日计划
  const showDate = (new Date().getHours()<4) ? yestKey : today;
  const todays = db.tasks.filter(t=>t.date===showDate || (new Date().getHours()<4 && isFuturePlan(t.date)) || (t.date===today)).filter((v,i,a)=>a.findIndex(x=>x.id===v.id)===i).sort((a,b)=>{
    const order={high:0,mid:1,low:2};
    if(a.done!==b.done) return a.done?1:-1;
    return order[a.priority]-order[b.priority];
  });
  const list=$('taskList'); list.innerHTML='';
  $('taskEmpty').style.display = todays.length?'none':'block';
  todays.forEach(t=>{
    const li=document.createElement('li');
    li.className='task-item'+(t.done?' done':'');
    li.innerHTML=`
      <div class="task-check ${t.done?'done':''}" data-id="${t.id}"></div>
      <span class="task-text" data-id="${t.id}">${escapeHtml(t.text)}</span>
      <span class="task-priority ${t.priority}" data-id="${t.id}">${{high:'高',mid:'中',low:'低'}[t.priority]}</span>
      <span class="task-time">${t.time}</span>
      <button class="task-edit" data-id="${t.id}" title="编辑">✎</button>
      <button class="task-del" data-id="${t.id}" title="删除">×</button>`;
    list.appendChild(li);
  });
  const done=todays.filter(t=>t.done).length;
  $('taskDone').textContent=`完成 ${done}`;
  $('taskTotal').textContent=`总计 ${todays.length}`;
  const pct = todays.length? Math.round(done/todays.length*100):0;
  $('taskProgress').style.width = pct+'%';

  // 历史计划（按日期分组）
  const hist=$('historyTasks'); hist.innerHTML='';
  const byDate={};
  db.tasks.filter(t=>t.date!==showDate && t.date!==today).forEach(t=>{
    if(!byDate[t.date]) byDate[t.date]=[];
    byDate[t.date].push(t);
  });
  Object.keys(byDate).sort((a,b)=>b.localeCompare(a)).slice(0,7).forEach(date=>{
    const items=byDate[date];
    const d=items.filter(t=>t.done).length;
    const li=document.createElement('li');
    li.className='hist-group';
    li.innerHTML=`<div class="hist-date">📅 ${date} <span class="hist-progress">完成 ${d}/${items.length}</span></div>`;
    items.forEach(t=>{
      const sub=document.createElement('div');
      sub.className='hist-item'+(t.done?' done':'');
      sub.innerHTML=`<span class="hist-check">${t.done?'✓':'○'}</span><span class="hist-text">${escapeHtml(t.text)}</span><span class="hist-pri ${t.priority}">${{high:'高',mid:'中',low:'低'}[t.priority]}</span>`;
      li.appendChild(sub);
    });
    hist.appendChild(li);
  });
}
$('taskForm').addEventListener('submit',e=>{
  e.preventDefault();
  const text=$('taskInput').value.trim();
  if(!text) return;
  let dateStr=todayKey();
  if($('taskDate').value==='tomorrow'){
    const d=new Date(); d.setDate(d.getDate()+1);
    dateStr=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  db.tasks.push({ id:uid(), text, priority:$('taskPriority').value, done:false, date:dateStr, time:nowTime() });
  save(db); $('taskInput').value=''; renderTasks(); renderOverview();
  toast($('taskDate').value==='tomorrow'?'已添加到明天计划':'计划已添加');
});
$('taskList').addEventListener('click',e=>{
  const id=e.target.dataset.id; if(!id) return;
  if(e.target.classList.contains('task-check')){
    const t=db.tasks.find(x=>x.id===id); if(t){ t.done=!t.done; save(db); renderTasks(); renderOverview(); }
  }else if(e.target.classList.contains('task-del')){
    db.tasks=db.tasks.filter(x=>x.id!==id); save(db); renderTasks(); renderOverview();
  }else if(e.target.classList.contains('task-edit')){
    openEditTask(id);
  }
});
// 编辑计划
let editingTaskId=null;
function openEditTask(id){
  const t=db.tasks.find(x=>x.id===id); if(!t) return;
  editingTaskId=id;
  $('editTaskText').value=t.text;
  $('editTaskPriority').value=t.priority;
  $('editTaskOverlay').classList.add('show');
}
$('editTaskClose').addEventListener('click',()=>{ $('editTaskOverlay').classList.remove('show'); editingTaskId=null; });
$('editTaskOverlay').addEventListener('click',e=>{ if(e.target===$('editTaskOverlay')){ $('editTaskOverlay').classList.remove('show'); editingTaskId=null; } });
$('editTaskForm').addEventListener('submit',e=>{
  e.preventDefault();
  if(!editingTaskId) return;
  const t=db.tasks.find(x=>x.id===editingTaskId); if(!t) return;
  t.text=$('editTaskText').value.trim();
  t.priority=$('editTaskPriority').value;
  save(db);
  $('editTaskOverlay').classList.remove('show');
  editingTaskId=null;
  renderTasks(); renderOverview();
  toast('计划已修改');
});

// ---------- 英语学习 ----------
const WORDS_BANK = [
  {w:'schedule',p:'/ˈskedʒuːl/',m:'n. 日程安排（工作常用）'},
  {w:'confirm',p:'/kənˈfɜːrm/',m:'v. 确认（开会/预约常用）'},
  {w:'available',p:'/əˈveɪləbl/',m:'a. 有空的；可用的'},
  {w:'reschedule',p:'/ˌriːˈskedʒuːl/',m:'v. 重新安排时间'},
  {w:'deadline',p:'/ˈdedlaɪn/',m:'n. 截止日期'},
  {w:'feedback',p:'/ˈfiːdbæk/',m:'n. 反馈'},
  {w:'negotiate',p:'/nɪˈɡoʊʃieɪt/',m:'v. 谈判；协商'},
  {w:'commitment',p:'/kəˈmɪtmənt/',m:'n. 承诺；约定'},
  {w:'appreciate',p:'/əˈpriːʃieɪt/',m:'v. 感激（邮件常用）'},
  {w:'colleague',p:'/ˈkɒliːɡ/',m:'n. 同事'},
  {w:'efficient',p:'/ɪˈfɪʃnt/',m:'a. 高效的'},
  {w:'clarify',p:'/ˈklærəfaɪ/',m:'v. 澄清；说明'},
  {w:'perspective',p:'/pərˈspektɪv/',m:'n. 观点；视角'},
  {w:'reasonable',p:'/ˈriːzənəbl/',m:'a. 合理的'},
  {w:'apologize',p:'/əˈpɒlədʒaɪz/',m:'v. 道歉'},
  {w:'compromise',p:'/ˈkɒmprəmaɪz/',m:'n./v. 妥协'},
  {w:'appointment',p:'/əˈpɔɪntmənt/',m:'n. 预约'},
  {w:'budget',p:'/ˈbʌdʒɪt/',m:'n. 预算'},
  {w:'decision',p:'/dɪˈsɪʒn/',m:'n. 决定'},
  {w:'experience',p:'/ɪkˈspɪriəns/',m:'n. 经验；体验'},
  {w:'familiar',p:'/fəˈmɪliər/',m:'a. 熟悉的'},
  {w:'recommend',p:'/ˌrekəˈmend/',m:'v. 推荐'},
  {w:'situation',p:'/ˌsɪtʃuˈeɪʃn/',m:'n. 情况'},
  {w:'understand',p:'/ˌʌndərˈstænd/',m:'v. 理解'},
  {w:'communicate',p:'/kəˈmjuːnɪkeɪt/',m:'v. 沟通'},
  {w:'responsible',p:'/rɪˈspɒnsəbl/',m:'a. 负责的'},
  {w:'suggestion',p:'/səˈdʒestʃən/',m:'n. 建议'},
  {w:'difference',p:'/ˈdɪfrəns/',m:'n. 区别'},
  {w:'important',p:'/ɪmˈpɔːrtnt/',m:'a. 重要的'},
  {w:'possible',p:'/ˈpɒsəbl/',m:'a. 可能的'}
];
let curWordIdx=0;
function renderEnglish(){
  const today=todayKey();
  const streak=calcStreak();
  $('streakStat').textContent=`连续 ${streak} 天`;
  $('wordStat').textContent=`已记 ${db.myWords.length} 词`;
  $('myWordCount').textContent=db.myWords.length;
  renderStudyTime();

  const w=WORDS_BANK[curWordIdx];
  $('wordText').textContent=w.w;
  $('wordPhonetic').textContent=w.p;
  $('wordMeaning').textContent=w.m;
  $('wordMeaning').style.display='none';

  const my=$('myWordList'); my.innerHTML='';
  db.myWords.forEach((item,i)=>{
    const li=document.createElement('li');
    li.innerHTML=`<span class="w">${escapeHtml(item.w)}</span><span class="m">${escapeHtml(item.m)}</span><button data-i="${i}">×</button>`;
    my.appendChild(li);
  });
  renderCalendar();
}

// ---------- 学习计时 ----------
let studyTimer=null;
let studyStartTime=null;
function startStudyTimer(){
  if(studyTimer) return; // 已在计时
  studyStartTime=Date.now();
  studyTimer=setInterval(()=>{
    // 每 10 秒存一次
    saveStudyTime();
  },10000);
}
function stopStudyTimer(){
  if(!studyTimer) return;
  saveStudyTime();
  clearInterval(studyTimer);
  studyTimer=null;
  studyStartTime=null;
}
function saveStudyTime(){
  if(!studyStartTime) return;
  const elapsed=Math.floor((Date.now()-studyStartTime)/1000); // 秒
  const today=todayKey();
  if(!db.studyTime) db.studyTime={};
  if(!db.studyTime[today]) db.studyTime[today]=0;
  db.studyTime[today]+=elapsed;
  studyStartTime=Date.now(); // 重置起点
  save(db);
  renderStudyTime();
}
function getTodayStudyMinutes(){
  const today=todayKey();
  return Math.floor((db.studyTime&&db.studyTime[today]||0)/60);
}
function renderStudyTime(){
  const mins=getTodayStudyMinutes();
  $('studyTimeStat').textContent=`今日学习 ${mins}分钟`;
  // 统计面板
  const sum=$('studyTimeSummary');
  if(!sum) return;
  if(!db.studyTime){ sum.innerHTML='<div class="sts-row"><span class="sts-label">暂无记录</span></div>'; return; }
  const entries=Object.entries(db.studyTime).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,7);
  const maxVal=Math.max(...entries.map(e=>e[1]),1);
  const totalSec=Object.values(db.studyTime).reduce((a,b)=>a+b,0);
  const html=entries.map(([date,sec])=>{
    const m=Math.floor(sec/60);
    const pct=Math.round(sec/maxVal*100);
    const isToday=date===todayKey();
    return `<div class="sts-row">
      <span class="sts-label">${date}${isToday?' (今天)':''}</span>
      <div class="sts-bar-wrap"><div class="sts-bar" style="width:${pct}%"></div></div>
      <span class="sts-value${isToday?' today':''}">${m}分钟</span>
    </div>`;
  }).join('');
  sum.innerHTML=`${html}<div class="sts-row" style="margin-top:8px;border-top:1px solid var(--border);padding-top:10px"><span class="sts-label">累计学习</span><span class="sts-value" style="color:var(--accent)">${Math.floor(totalSec/60)}分钟</span></div>`;
}
function calcStreak(){
  let s=0; const d=new Date();
  while(true){
    const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if(db.studyLog.includes(k)){ s++; d.setDate(d.getDate()-1); }
    else break;
  }
  return s;
}
function renderCalendar(){
  const cal=$('studyCalendar'); cal.innerHTML='';
  const d=new Date(); const y=d.getFullYear(),m=d.getMonth();
  const first=new Date(y,m,1).getDay();
  const days=new Date(y,m+1,0).getDate();
  for(let i=0;i<first;i++) cal.appendChild(document.createElement('div')).className='cal-cell';
  for(let i=1;i<=days;i++){
    const k=`${y}-${String(m+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
    const cell=document.createElement('div');
    cell.className='cal-cell'+(db.studyLog.includes(k)?' done':'');
    cell.innerHTML=`<span class="day">${i}</span>`;
    cal.appendChild(cell);
  }
}
$('showMeaning').addEventListener('click',()=>{ $('wordMeaning').style.display='block'; });
$('playWord').addEventListener('click',()=>{
  const w=WORDS_BANK[curWordIdx];
  if('speechSynthesis' in window){
    const u=new SpeechSynthesisUtterance(w.w);
    u.lang='en-US'; u.rate=0.8;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }else{
    toast('当前浏览器不支持语音朗读');
  }
});
$('nextWord').addEventListener('click',()=>{
  curWordIdx=(curWordIdx+1)%WORDS_BANK.length;
  renderEnglish();
});
$('addMyWord').addEventListener('click',()=>{
  const w=WORDS_BANK[curWordIdx];
  if(db.myWords.some(x=>x.w===w.w)){ toast('已在生词本中'); return; }
  db.myWords.push({w:w.w,m:w.m}); save(db);
  const today=todayKey();
  if(!db.studyLog.includes(today)){ db.studyLog.push(today); save(db); }
  renderEnglish(); renderOverview();
  toast('已加入生词本，今日打卡完成 ✦');
});
$('customWordForm').addEventListener('submit',e=>{
  e.preventDefault();
  const w=$('customWord').value.trim();
  const m=$('customMeaning').value.trim();
  if(!w||!m) return;
  db.myWords.push({w,m}); save(db);
  $('customWord').value=''; $('customMeaning').value='';
  renderEnglish(); toast('已添加到生词本');
});
$('myWordList').addEventListener('click',e=>{
  if(e.target.tagName==='BUTTON'){
    const i=+e.target.dataset.i; db.myWords.splice(i,1); save(db); renderEnglish();
  }
});

// ---------- 消费记账 ----------
// 平台与收入来源配置
const EXPENSE_PLATFORMS = [
  '淘宝','京东','拼多多','抖音','快手','唯品会','支付宝','微信支付',
  '美团','饿了么','影视会员','学习','看书','信用卡还款','贷款还款','其他'
];
const INCOME_SOURCES = ['工资','兼职','理财收益','退款','红包','转账','其他'];
const EXPENSE_ICONS = {
  '淘宝':'🛍','京东':'📦','拼多多':'🍒','抖音':'🎵','快手':'⚡','唯品会':'👗',
  '支付宝':'💰','微信支付':'💚','美团':'🍜','饿了么':'🍔',
  '影视会员':'🎬','学习':'📚','看书':'📖','信用卡还款':'💳','贷款还款':'🏦','其他':'🧾'
};
const INCOME_ICONS = {
  '工资':'💼','兼职':'🔧','理财收益':'📈','退款':'↩️','红包':'🧧','转账':'🔁','其他':'➕'
};

// 初始化平台下拉
function fillPlatformSelect(type){
  const sel=$('spendPlatform');
  const list = type==='income' ? INCOME_SOURCES : EXPENSE_PLATFORMS;
  sel.innerHTML='<option value="">选择来源/平台</option>'+list.map(p=>`<option value="${p}">${p}</option>`).join('');
}
$('spendType').addEventListener('change',e=>fillPlatformSelect(e.target.value));

function renderFinance(){
  const mkey=monthKey();
  const monthSpends=db.spends.filter(s=>s.month===mkey);
  const today=todayKey();

  const mIncome=monthSpends.filter(s=>s.type==='income').reduce((a,s)=>a+s.amount,0);
  const mExpense=monthSpends.filter(s=>s.type==='expense').reduce((a,s)=>a+s.amount,0);
  const tExpense=db.spends.filter(s=>s.date===today && s.type==='expense').reduce((a,s)=>a+s.amount,0);
  const net=mIncome-mExpense;

  $('monthIncome').textContent=`本月收入 ¥${mIncome.toFixed(2)}`;
  $('monthExpense').textContent=`本月支出 ¥${mExpense.toFixed(2)}`;
  $('monthNet').textContent=`本月净额 ¥${net.toFixed(2)}`;
  $('monthNet').style.color = net>=0 ? 'var(--accent)' : 'var(--danger)';
  $('todaySpend').textContent=`今日支出 ¥${tExpense.toFixed(2)}`;

  const list=$('spendList'); list.innerHTML='';
  $('spendEmpty').style.display=db.spends.length?'none':'block';
  [...db.spends].reverse().slice(0,50).forEach(s=>{
    const isIncome = s.type==='income';
    const li=document.createElement('li');
    li.className='spend-item '+(isIncome?'income-row':'expense-row');
    const amtClass = isIncome ? 'amt-income' : 'amt-expense';
    const sign = isIncome ? '+' : '-';
    li.innerHTML=`
      <span class="spend-platform">${escapeHtml(s.platform)}</span>
      <span class="item-text">${escapeHtml(s.item||'—')} <span class="spend-time">${s.date} ${s.time}</span></span>
      <span class="spend-amount ${amtClass}">${sign}¥${s.amount.toFixed(2)}</span>
      <button class="spend-del" data-id="${s.id}">×</button>`;
    list.appendChild(li);
  });

  drawPlatformChart(monthSpends.filter(s=>s.type==='expense'));
  drawDailyChart();
  renderMonthlySummary();
}
function drawPlatformChart(spends){
  const cv=$('platformChart'); const ctx=cv.getContext('2d');
  ctx.clearRect(0,0,cv.width,cv.height);
  const byPlatform={};
  spends.forEach(s=>{ byPlatform[s.platform]=(byPlatform[s.platform]||0)+s.amount; });
  const entries=Object.entries(byPlatform).sort((a,b)=>b[1]-a[1]);
  if(entries.length===0){
    ctx.fillStyle='#8b97a7'; ctx.font='14px sans-serif';
    ctx.textAlign='center'; ctx.fillText('暂无支出数据',cv.width/2,cv.height/2); return;
  }
  const total=entries.reduce((a,[,v])=>a+v,0);
  const colors=['#5b9dff','#7fd1ae','#ffb547','#ff6b6b','#c084fc','#f59e0b','#10b981','#ec4899','#3b82f6','#a855f7','#ef4444','#06b6d4','#84cc16'];
  let angle=-Math.PI/2; const cx=cv.width/2,cy=cv.height/2,radius=Math.min(cx,cy)-30;
  entries.forEach(([p,v],i)=>{
    const slice=(v/total)*Math.PI*2;
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,radius,angle,angle+slice);
    ctx.closePath();
    ctx.fillStyle=colors[i%colors.length];
    ctx.fill();
    angle+=slice;
  });
  ctx.beginPath();ctx.arc(cx,cy,radius*0.55,0,Math.PI*2);ctx.fillStyle='#1a2028';ctx.fill();
  ctx.fillStyle='#e6edf3';ctx.font='bold 16px sans-serif';ctx.textAlign='center';
  ctx.fillText(`¥${total.toFixed(0)}`,cx,cy-4);
  ctx.fillStyle='#8b97a7';ctx.font='11px sans-serif';
  ctx.fillText('支出总计',cx,cy+14);
  ctx.textAlign='left';ctx.font='11px sans-serif';
  entries.forEach(([p,v],i)=>{
    const ly=20+i*18;
    ctx.fillStyle=colors[i%colors.length];
    ctx.fillRect(8,ly-9,10,10);
    ctx.fillStyle='#e6edf3';
    ctx.fillText(`${p} ¥${v.toFixed(0)} (${(v/total*100).toFixed(0)}%)`,24,ly);
  });
}
function drawDailyChart(){
  const cv=$('dailyChart');const ctx=cv.getContext('2d');
  ctx.clearRect(0,0,cv.width,cv.height);
  const days=[];const d=new Date();
  for(let i=6;i>=0;i--){
    const dd=new Date(d);dd.setDate(dd.getDate()-i);
    const k=`${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,'0')}-${String(dd.getDate()).padStart(2,'0')}`;
    const inc=db.spends.filter(s=>s.date===k&&s.type==='income').reduce((a,s)=>a+s.amount,0);
    const exp=db.spends.filter(s=>s.date===k&&s.type==='expense').reduce((a,s)=>a+s.amount,0);
    days.push({k, inc, exp, label:String(dd.getDate())});
  }
  const max=Math.max(...days.flatMap(x=>[x.inc,x.exp]),1);
  const bw=18, gap=12, baseY=cv.height-40;
  days.forEach((x,i)=>{
    const bx=24+i*(bw*2+gap);
    const he=(x.exp/max)*(baseY-30);
    const hi=(x.inc/max)*(baseY-30);
    ctx.fillStyle='#ff6b6b';ctx.fillRect(bx, baseY-he, bw, he);
    ctx.fillStyle='#7fd1ae';ctx.fillRect(bx+bw, baseY-hi, bw, hi);
    ctx.fillStyle='#8b97a7';ctx.font='11px sans-serif';ctx.textAlign='center';
    ctx.fillText(x.label, bx+bw, baseY+14);
    if(x.exp>0){ctx.fillStyle='#ffb547';ctx.fillText('-'+x.exp.toFixed(0), bx+bw/2, baseY-he-4);}
    if(x.inc>0){ctx.fillStyle='#7fd1ae';ctx.fillText('+'+x.inc.toFixed(0), bx+bw*1.5, baseY-hi-4);}
  });
  ctx.strokeStyle='#2d3748';ctx.beginPath();ctx.moveTo(10,baseY);ctx.lineTo(cv.width-10,baseY);ctx.stroke();
  // 图例
  ctx.textAlign='left';ctx.font='11px sans-serif';
  ctx.fillStyle='#ff6b6b';ctx.fillRect(10,4,10,10);ctx.fillStyle='#e6edf3';ctx.fillText('支出',24,13);
  ctx.fillStyle='#7fd1ae';ctx.fillRect(70,4,10,10);ctx.fillStyle='#e6edf3';ctx.fillText('收入',84,13);
}
function renderMonthlySummary(){
  const byMonth={};
  db.spends.forEach(s=>{
    if(!byMonth[s.month]) byMonth[s.month]={inc:0,exp:0};
    if(s.type==='income') byMonth[s.month].inc+=s.amount;
    else byMonth[s.month].exp+=s.amount;
  });
  const html=Object.entries(byMonth).sort((a,b)=>b[0].localeCompare(a[0])).map(([m,v])=>{
    const net=v.inc-v.exp;
    return `<tr><td>${m}</td><td class="amt" style="color:var(--accent)">+¥${v.inc.toFixed(2)}</td><td class="amt" style="color:var(--warn)">-¥${v.exp.toFixed(2)}</td><td class="amt" style="color:${net>=0?'var(--accent)':'var(--danger)'}">${net>=0?'+':''}¥${net.toFixed(2)}</td></tr>`;
  }).join('')||'<tr><td colspan="4">暂无</td></tr>';
  $('monthlySummary').innerHTML=`<table><thead><tr><th>月份</th><th style="text-align:right">收入</th><th style="text-align:right">支出</th><th style="text-align:right">净额</th></tr></thead><tbody>${html}</tbody></table>`;
}
$('spendForm').addEventListener('submit',e=>{
  e.preventDefault();
  const type=$('spendType').value;
  const platform=$('spendPlatform').value;
  const amount=parseFloat($('spendAmount').value);
  const item=$('spendItem').value.trim();
  if(!platform||!amount) return;
  db.spends.push({
    id:uid(), type, platform, amount, item,
    date:todayKey(), time:nowTime(), month:monthKey()
  });
  save(db);
  $('spendPlatform').value='';$('spendAmount').value='';$('spendItem').value='';
  renderFinance(); renderOverview();
  toast(`已记账 ${platform} ${type==='income'?'+':'-'}¥${amount.toFixed(2)}`);
});

// ---------- 快捷记账大按钮 ----------
let curQuickType='expense';
function renderQuickButtons(){
  const grid=$('quickGrid'); if(!grid) return;
  grid.innerHTML='';
  const list = curQuickType==='income' ? INCOME_SOURCES : EXPENSE_PLATFORMS;
  const icons = curQuickType==='income' ? INCOME_ICONS : EXPENSE_ICONS;
  list.forEach(p=>{
    const btn=document.createElement('button');
    btn.className='qbtn';
    btn.dataset.platform=p;
    btn.innerHTML=`<span class="pi">${icons[p]||'🧾'}</span>${p}`;
    btn.addEventListener('click',()=>openQuickSpend(p,curQuickType));
    grid.appendChild(btn);
  });
}
document.querySelectorAll('.qt-tab').forEach(t=>{
  t.addEventListener('click',()=>{
    document.querySelectorAll('.qt-tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    curQuickType=t.dataset.type;
    renderQuickButtons();
  });
});
function openQuickSpend(platform,type){
  $('qsPlatform').textContent=platform;
  $('qsTypeTag').textContent=type==='income'?'收入':'支出';
  $('qsTypeTag').className='qs-type-tag'+(type==='income'?' income':'');
  $('qsOverlay').dataset.type=type;
  $('qsOverlay').classList.add('show');
  $('qsAmount').value=''; $('qsItem').value='';
  setTimeout(()=>$('qsAmount').focus(),100);
}
function closeQuickSpend(){ $('qsOverlay').classList.remove('show'); }
$('qsClose').addEventListener('click',closeQuickSpend);
$('qsOverlay').addEventListener('click',e=>{ if(e.target===$('qsOverlay')) closeQuickSpend(); });
$('qsForm').addEventListener('submit',e=>{
  e.preventDefault();
  const platform=$('qsPlatform').textContent;
  const type=$('qsOverlay').dataset.type||'expense';
  const amount=parseFloat($('qsAmount').value);
  const item=$('qsItem').value.trim();
  if(!amount) return;
  db.spends.push({
    id:uid(), type, platform, amount, item,
    date:todayKey(), time:nowTime(), month:monthKey()
  });
  save(db); closeQuickSpend();
  renderFinance(); renderOverview();
  toast(`已记账 ${platform} ${type==='income'?'+':'-'}¥${amount.toFixed(2)}`);
});
document.querySelectorAll('.qs-quick-amounts button').forEach(b=>{
  b.addEventListener('click',()=>{ $('qsAmount').value=b.dataset.amt; $('qsAmount').focus(); });
});
$('spendList').addEventListener('click',e=>{
  if(e.target.classList.contains('spend-del')){
    const id=e.target.dataset.id;
    db.spends=db.spends.filter(s=>s.id!==id);
    save(db); renderFinance(); renderOverview();
  }
});

// ---------- 快速记爆款 ----------
let qvPlatform='抖音';
document.querySelectorAll('.qv-p').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('.qv-p').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    qvPlatform=b.dataset.p;
    $('viralPlatform').value=qvPlatform;
  });
});
async function getClipboard(){
  try{
    const text=await navigator.clipboard.readText();
    return text.trim();
  }catch(e){
    return null;
  }
}
$('pasteTitle').addEventListener('click',async()=>{
  const text=await getClipboard();
  const tip=$('qvTipBox');
  if(text){
    $('viralTitle').value=text.slice(0,60);
    $('viralPlatform').value=qvPlatform;
    $('qvTipBox').textContent='✓ 已粘贴到标题框，填播放量点赞后点记录';
    toast('标题已粘贴');
  }else{
    $('qvTipBox').textContent='⚠️ 无法自动读取剪贴板，请手动粘贴到标题框';
    toast('请手动粘贴（浏览器限制自动读取）');
    $('viralTitle').focus();
  }
});
$('pasteAndFill').addEventListener('click',async()=>{
  const text=await getClipboard();
  if(!text){
    $('qvTipBox').textContent='⚠️ 无法自动读取剪贴板，请手动粘贴到标题框后点记录';
    toast('请手动粘贴');
    return;
  }
  const title=text.slice(0,60);
  if(!db.virals) db.virals=[];
  db.virals.push({
    id:uid(), title, platform:qvPlatform,
    views:0, likes:0,
    date:todayKey(), time:nowTime()
  });
  save(db); renderViral();
  $('qvTipBox').textContent=`✓ 已记录：${title.slice(0,20)}... [${qvPlatform}]`;
  toast(`已记爆款：${qvPlatform}`);
});

// ---------- iOS 快捷指令收件箱 ----------
const API_BASE = window.location.origin.replace(/:\d+$/, '') + ':8001';
// 如果是 preview 域名，用同域 8001 端口
const INBOX_URL = (() => {
  const u = new URL(window.location.href);
  // 预览域名格式：https://webview.xxx.sandbox.xxx/?x-cs-sandbox-port=8000
  // API 端口是 8001，需要重新构造
  const port = u.searchParams.get('x-cs-sandbox-port');
  if(port){
    const newUrl = u.origin + u.pathname + '?' + u.searchParams.toString().replace('x-cs-sandbox-port=8000','x-cs-sandbox-port=8001');
    return newUrl.replace('/','');
  }
  // 本地开发
  return window.location.origin.replace(/:\d+$/,'') + ':8001/api/inbox';
})();
const POST_URL = INBOX_URL.replace('/api/inbox','/api/viral');

function setApiUrl(){
  // 兼容旧元素
  const old=document.getElementById('apiUrl');
  if(old) old.value = POST_URL;
  const u1=document.getElementById('shortcutApiUrl');
  if(u1) u1.textContent = POST_URL;
  const preview=document.getElementById('jsonPreview');
  if(preview){
    preview.textContent = JSON.stringify({
      title: "${titleInput}",
      platform: "抖音",
      views: 0,
      likes: 0
    }, null, 2);
  }
}
// 复制按钮
document.addEventListener('DOMContentLoaded',()=>{
  const cb=document.getElementById('copyApiUrl');
  if(cb) cb.addEventListener('click',()=>{
    navigator.clipboard.writeText(POST_URL).then(()=>{
      toast('API URL 已复制，粘贴到快捷指令里');
    }).catch(()=>toast('复制失败，手动复制'));
  });
  const tb=document.getElementById('testInbox');
  if(tb) tb.addEventListener('click',async()=>{
    const r=document.getElementById('syncResult');
    if(r) r.textContent='同步中...';
    await fetchInbox();
    if(r) r.textContent='✓ 已同步';
    setTimeout(()=>{ if(r) r.textContent=''; },3000);
  });
});
// 暴露 toast 给 inline
window._toast = toast;
async function fetchInbox(){
  try{
    const resp = await fetch(INBOX_URL, {cache:'no-store'});
    if(!resp.ok) return;
    const items = await resp.json();
    if(!items || !items.length) return;
    if(!db.virals) db.virals=[];
    let added=0;
    items.forEach(it=>{
      if(!db.virals.some(v=>v.id===it.id)){
        const d=new Date(it.ts*1000);
        db.virals.push({
          id:it.id, title:it.title, platform:it.platform||'其他',
          views:it.views||0, likes:it.likes||0,
          date:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,
          time:`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
        });
        added++;
      }
    });
    if(added>0){
      save(db); renderViral();
      toast(`从 iPhone 收件箱同步了 ${added} 条爆款`);
      // 清空服务端收件箱
      fetch(INBOX_URL.replace('/api/inbox','/api/clear'),{method:'GET'}).catch(()=>{});
    }
  }catch(e){ /* 后端不在线，静默 */ }
}

// ---------- 视频爆款发现 ----------
const VIRAL_RULES = [
  {t:'黄金前3秒',d:'前3秒决定生死，用冲突/悬念/反常/利益点开场，别铺垫'},
  {t:'标题带钩子',d:'标题埋疑问或反差，如"为什么我从大厂辞职去卖煎饼"'},
  {t:'情绪共鸣',d:'让用户产生"我也是""说得太对了"的感觉，评论区会自发刷'},
  {t:'节奏密度',d:'15秒内至少2个信息点或转折，避免长镜头和无效空镜'},
  {t:'争议性话题',d:'适度争议引发讨论，但别踩红线，评论区热度=推荐权重'},
  {t:'实用价值',d:'干货类(教程/避坑/省钱)收藏率高，收藏也是推荐信号'},
  {t:'BGM踩点',d:'热门BGM蹭流量，音乐卡点能提升完播率30%以上'},
  {t:'发布时间',d:'工作日12-13点、18-20点、21-23点；周末全天流量好'}
];
const VIRAL_TIPS = [
  '涨粉核心是<b>持续输出同一垂直领域</b>的内容，算法靠标签识别你是谁，乱发=账号标签混乱=不推荐',
  '新手期前 10 条视频决定账号定位，<b>别急着发，先想清楚赛道</b>：知识/搞笑/美食/穿搭/职场/萌宠',
  '<b>完播率</b>是第一指标，比点赞重要。短视频控制在 15-30 秒，把最炸的放开头，结尾留钩子引导重播',
  '涨粉最快的内容形式：<b>系列教程</b>（用户为看下集会关注）、<b>合集盘点</b>（信息量大易收藏）、<b>对比测评</b>（决策类内容收藏高）',
  '<b>评论区要自己运营</b>：置顶一条引导互动的评论，回复前排粉丝，争议性话题让评论区吵起来=流量翻倍',
  '封面统一风格 + 标题模板化，主页看起来专业，访客转粉率能提升 2-3 倍',
  '热点要快，<b>看到热点 2 小时内发</b>，晚了就没流量。日常攒 3-5 个模板，热点来了直接套',
  '<b>直播涨粉比短视频快</b>，开播有流量扶持，直播切片再发短视频形成循环',
  '数据不好别删视频，<b>隐藏即可</b>。删视频会降账号权重，隐藏不影响',
  '涨粉瓶颈期试试<b>转型或细分</b>：美食太卷就做"10分钟快手菜"，职场太宽就做"30岁程序员转型"'
];
const NICHES = [
  {i:'🍳',n:'美食赛道',topics:['10分钟快手菜','一人食晚餐','宿舍料理','空气炸锅万物','5元挑战做一顿饭','黑暗料理测评','复刻网红餐厅菜','冰箱剩菜大拯救','减脂餐不挨饿','懒人早餐'],formula:'公式：限制条件(时间/预算/工具) + 具体菜品 + 情绪钩子'},
  {i:'💼',n:'职场赛道',topics:['打工人的一天','职场避坑指南','离职前没人告诉你的事','简历怎么改','面试反问环节','副业搞钱实录','30岁转行','职场社交潜规则','整顿职场00后','远程办公真相'],formula:'公式：身份共鸣 + 反常识观点 + 实用建议'},
  {i:'👗',n:'穿搭赛道',topics:['微胖穿搭','身高150穿搭','百元搭一身','通勤穿搭一周','色系穿搭','旧衣改造','不同场合穿搭','平价替代大牌','胖女孩穿搭','季节过渡穿搭'],formula:'公式：明确人群标签 + 具体场景 + 可复制的搭配公式'},
  {i:'📚',n:'知识赛道',topics:['一分钟看懂XX','书籍精华解读','历史冷知识','科普反常识','理财入门','心理学效应','效率工具分享','考证经验','读书笔记','行业揭秘'],formula:'公式：信息降维 + 反常识点 + 可操作结论'},
  {i:'😂',n:'搞笑赛道',topics:['当代年轻人现状','社死瞬间','爸妈的迷惑行为','打工人的怨念','室友日常','情侣迷惑行为','MBTI梗','当代社交礼仪','打工梗合集','反差人设'],formula:'公式：身份共鸣场景 + 反差/夸张 + 留白让观众笑'},
  {i:'💄',n:'美妆赛道',topics:['新手化妆','5分钟出门妆','平价彩妆测评','换头术','早八人妆容','伪素颜妆','节日主题妆','黑皮女孩妆容','眼妆教程','化妆误区'],formula:'公式：明确需求场景 + 前后对比 + 可复制的步骤'},
  {i:'🐾',n:'萌宠赛道',topics:['猫的一天','养猫踩坑','狗子迷惑行为','宠物开箱','救助流浪猫','不同品种对比','宠物搞笑配音','养宠花费','宠物健康知识','宠物ASMR'],formula:'公式：萌点放大 + 人格化叙事 + 情感共鸣'},
  {i:'🏃',n:'健身赛道',topics:['居家健身','无器械练腿','减脂餐','增肌饮食','体态矫正','跑步入门','健身一年对比','新手健身误区','拉伸跟练','体脂下降经验'],formula:'公式：明确人群 + 痛点 + 真实变化/数据'},
  {i:'👶',n:'母婴赛道',topics:['待产包','新生儿护理','辅食制作','孕期饮食','育儿避坑','平价母婴好物','爸爸带娃','宝宝作息调整','疫苗攻略','亲子游戏'],formula:'公式：阶段痛点 + 实用清单 + 过来人经验'},
  {i:'🏠',n:'生活赛道',topics:['租房改造','独居生活','收纳整理','断舍离','一人食','周末仪式感','低成本生活','房间布置','二手好物','生活小妙招'],formula:'公式：美好向往 + 低门槛可复制 + 真实细节'}
];
function renderViral(){
  const rg=$('rulesGrid'); rg.innerHTML='';
  VIRAL_RULES.forEach(r=>{
    const d=document.createElement('div');
    d.className='rule-card';
    d.innerHTML=`<div class="rt">${r.t}</div><div class="rd">${r.d}</div>`;
    rg.appendChild(d);
  });
  const tl=$('tipsList'); tl.innerHTML='';
  VIRAL_TIPS.forEach((t,i)=>{
    const d=document.createElement('div');
    d.className='tip-item';
    d.innerHTML=`<div class="tip-num">${i+1}</div><div class="tip-text">${t}</div>`;
    tl.appendChild(d);
  });
  // 赛道方向库
  const nl=$('nicheList'); nl.innerHTML='';
  NICHES.forEach((nc,idx)=>{
    const d=document.createElement('div');
    d.className='niche-item';
    const topicsHtml = nc.topics.map(t=>`<span class="topic">${t}</span>`).join('');
    d.innerHTML=`
      <div class="niche-head" data-idx="${idx}">
        <span><span class="ni-icon">${nc.i}</span>${nc.n}</span>
        <span class="ni-arrow">▶</span>
      </div>
      <div class="niche-body">
        ${topicsHtml}
        <div class="formula">📐 ${nc.formula}</div>
      </div>`;
    nl.appendChild(d);
  });
  nl.querySelectorAll('.niche-head').forEach(h=>{
    h.addEventListener('click',()=>{ h.parentElement.classList.toggle('open'); });
  });
  // 列表
  const list=$('viralList'); list.innerHTML='';
  $('viralEmpty').style.display = db.virals && db.virals.length ? 'none':'block';
  $('viralCount').textContent=`已记 ${(db.virals||[]).length} 条`;
  (db.virals||[]).slice().reverse().forEach(v=>{
    const li=document.createElement('li');
    li.className='viral-item';
    const ratio = v.views>0 ? (v.likes/v.views*100).toFixed(1) : '0';
    li.innerHTML=`
      <button class="viral-del" data-id="${v.id}">×</button>
      <div class="vi-head">
        <span class="vi-title">${escapeHtml(v.title)}</span>
        <span class="vi-platform">${escapeHtml(v.platform)}</span>
      </div>
      <div class="vi-stats">
        <span>▶ ${v.views.toLocaleString()} 播放</span>
        <span>❤ ${v.likes.toLocaleString()} 点赞</span>
        <span>📈 ${ratio}% 互动率</span>
      </div>
      <div class="vi-time">${v.date} ${v.time}</div>`;
    list.appendChild(li);
  });
}
$('viralForm').addEventListener('submit',e=>{
  e.preventDefault();
  if(!db.virals) db.virals=[];
  const title=$('viralTitle').value.trim();
  const platform=$('viralPlatform').value;
  const views=parseInt($('viralViews').value)||0;
  const likes=parseInt($('viralLikes').value)||0;
  if(!title) return;
  db.virals.push({ id:uid(), title, platform, views, likes, date:todayKey(), time:nowTime() });
  save(db);
  $('viralTitle').value='';$('viralViews').value='';$('viralLikes').value='';
  renderViral();
  toast('爆款已记录');
});
$('viralList').addEventListener('click',e=>{
  if(e.target.classList.contains('viral-del')){
    const id=e.target.dataset.id;
    db.virals=db.virals.filter(v=>v.id!==id);
    save(db); renderViral();
  }
});

// ---------- 综合概览 ----------
function renderOverview(){
  const today=todayKey(), mkey=monthKey();
  const todays=db.tasks.filter(t=>t.date===today);
  const done=todays.filter(t=>t.done).length;
  const pct=todays.length?Math.round(done/todays.length*100):0;
  $('ovTaskProgress').textContent=pct+'%';
  $('ovTaskDetail').textContent=`${done} / ${todays.length}`;
  $('ovStreak').textContent=calcStreak();
  const todayExp=db.spends.filter(s=>s.date===today&&s.type==='expense');
  $('ovSpend').textContent='¥'+todayExp.reduce((a,s)=>a+s.amount,0).toFixed(2);
  $('ovSpendCount').textContent=`${todayExp.length} 笔支出`;
  const mInc=db.spends.filter(s=>s.month===mkey&&s.type==='income').reduce((a,s)=>a+s.amount,0);
  const mExp=db.spends.filter(s=>s.month===mkey&&s.type==='expense').reduce((a,s)=>a+s.amount,0);
  const net=mInc-mExp;
  $('ovMonthNet').textContent=(net>=0?'+':'')+'¥'+net.toFixed(2);
  $('ovMonthNet').style.color = net>=0?'var(--primary)':'var(--danger)';
  $('ovMonthCount').textContent=`收入¥${mInc.toFixed(0)} / 支出¥${mExp.toFixed(0)}`;
}

// ---------- 备份 ----------
$('exportData').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`starchen_backup_${todayKey()}.json`;
  a.click();
  toast('备份已导出');
});
$('importData').addEventListener('click',()=>$('importFile').click());
$('importFile').addEventListener('change',e=>{
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=()=>{
    try{
      const data=JSON.parse(r.result);
      if(!data.tasks||!data.spends) throw 1;
      db=Object.assign({tasks:[],words:[],myWords:[],studyLog:[],spends:[]},data);
      save(db); renderAll();
      toast('备份已导入');
    }catch(err){ toast('文件格式错误'); }
  };
  r.readAsText(f);
});

// ---------- 通用 ----------
function escapeHtml(s){ return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function renderAll(){ renderDate(); renderTasks(); renderEnglish(); renderFinance(); renderViral(); renderOverview(); renderQuickButtons(); renderCover(); setApiUrl(); fetchInbox(); }
fillPlatformSelect('expense');
renderAll();
// 检测是否有自动备份可恢复
checkAutoBackup();
function checkAutoBackup(){
  const bak=localStorage.getItem(BACKUP_KEY);
  const cur=localStorage.getItem(DB_KEY);
  // 如果主数据空但备份有数据，显示恢复按钮
  if(bak && (!cur || cur==='[]' || cur==='{}')){
    const btn=document.getElementById('autoRestore');
    if(btn){
      btn.style.display='';
      btn.addEventListener('click',()=>{
        localStorage.setItem(DB_KEY, bak);
        db=load();
        renderAll();
        toast('已从自动备份恢复');
        btn.style.display='none';
      });
    }
  }
}
// 启动时默认显示封面，点"进入工作台"后跳到上次 tab
// 如果用户直接点侧边栏其他项，也会切换
// 每 30 秒拉一次收件箱
setInterval(fetchInbox, 30000);
// 页面隐藏/关闭时停止计时并保存
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){ stopStudyTimer(); }
  else if(document.querySelector('.tab.active')?.dataset.tab==='english'){ startStudyTimer(); }
});
window.addEventListener('beforeunload',stopStudyTimer);
