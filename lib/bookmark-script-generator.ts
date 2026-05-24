interface BookmarkStudent {
  name: string
  content: string
}

const BOOKMARK_SCRIPT = `
void function(){
var D=__DATA__, old=document.getElementById('__bw');
if(old){old.style.display=old.style.display==='none'?'block':'none';return}
if(typeof Element!=='undefined'&&!Element.prototype.closest){
Element.prototype.closest=function(s){var e=this;do{if(e.matches&&e.matches(s))return e;e=e.parentElement||e.parentNode}while(e&&e.nodeType===1);return null};
}

var S=document.createElement('style');S.id='__bw_s';
S.textContent=
'#__bw{position:fixed;z-index:2147483640;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;user-select:none}'+
'#__bw_w{width:400px;min-width:260px;min-height:140px;max-width:95vw;max-height:90vh;background:#fff;border-radius:14px;box-shadow:0 8px 40px rgba(0,0,0,.18),0 2px 8px rgba(0,0,0,.08);display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(0,0,0,.08);resize:both}'+
'#__bw_hd{display:flex;align-items:center;padding:10px 14px;background:#fafafa;border-bottom:1px solid #f0f0f0;cursor:move;gap:8px;flex-shrink:0}'+
'#__bw_lg{font-size:13px;font-weight:700;color:#7c3aed}'+
'#__bw_ct{font-size:11px;color:#999;flex:1}'+
'#__bw_min,.bw_close{width:28px;height:28px;border:none;background:transparent;border-radius:6px;font-size:14px;color:#999;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1}'+
'#__bw_min:hover,.bw_close:hover{background:#eee;color:#333}'+
'#__bw_bd{display:flex;flex:1;min-height:0;overflow:hidden}'+
'#__bw_l{width:140px;flex-shrink:0;overflow-y:auto;border-right:1px solid #f0f0f0;padding:6px;background:#fafafa}'+
'.bw_i{display:flex;align-items:center;padding:7px 10px;border-radius:7px;cursor:pointer;gap:6px;font-size:12px;margin-bottom:1px;color:#555;transition:all .1s}'+
'.bw_i:hover{background:#f3eeff}'+
'.bw_a{background:#f3eeff!important;color:#7c3aed!important;font-weight:600}'+
'.bw_c .bw_ck{opacity:1}'+
'.bw_num{width:20px;height:20px;border-radius:5px;background:#eee;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#999;flex-shrink:0}'+
'.bw_a .bw_num{background:#7c3aed;color:#fff}'+
'.bw_nm{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}'+
'.bw_ck{color:#22c55e;font-size:11px;font-weight:700;opacity:0;transition:opacity .15s}'+
'#__bw_r{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;background:#fff}'+
'.bw_tl{font-size:15px;font-weight:700;color:#111;margin-bottom:10px}'+
'.bw_tx{font-size:13px;line-height:1.7;color:#444;white-space:pre-wrap;flex:1;margin-bottom:14px}'+
'.bw_btn{display:inline-flex;align-items:center;gap:5px;align-self:flex-start;padding:8px 18px;background:linear-gradient(135deg,#7c3aed,#6366f1);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;box-shadow:0 2px 8px rgba(124,58,237,.25);transition:all .15s}'+
'.bw_btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(124,58,237,.35)}'+
'#__bw_ft{padding:6px 14px;border-top:1px solid #f0f0f0;font-size:11px;color:#ccc;display:flex;align-items:center;gap:12px;flex-shrink:0}'+
'#__bw_ft span{font-size:10px}'+
'.bw_resize{position:absolute;right:0;bottom:0;width:14px;height:14px;cursor:se-resize}';
document.head.appendChild(S);

var root=document.createElement('div');root.id='__bw';
root.innerHTML='<div id=__bw_w style=position:relative><div class=bw_resize id=__bw_rs></div><div id=__bw_hd><span id=__bw_lg>📋 TABuddy</span><span id=__bw_ct>'+D.length+' 人</span><button id=__bw_min title=最小化>—</button><button class=bw_close id=__bw_x title=关闭>&times;</button></div><div id=__bw_bd><div id=__bw_l></div><div id=__bw_r></div></div><div id=__bw_ft><span>↑↓ 切换 · 1~9 快速 · Ctrl+C 复制 · 拖拽移动 · 缩放右下角</span></div></div>';
document.body.appendChild(root);

var W=document.getElementById('__bw_w'),HD=document.getElementById('__bw_hd'),
 L=document.getElementById('__bw_l'),R=document.getElementById('__bw_r'),
 RS=document.getElementById('__bw_rs'),MIN=document.getElementById('__bw_min'),
 CL=document.getElementById('__bw_x'),dx=0,dy=0,sx=0,sy=0;

var idx=0,cp={},minimized=false,miniBtn=null;

root.style.right='20px';root.style.top='20px';

function destroy(){
 try{root.remove()}catch(e){}
 try{miniBtn&&miniBtn.remove()}catch(e){}
 try{S.remove()}catch(e){}
 try{document.removeEventListener('keydown',kd,true)}catch(e){}
}

function rl(){
 var h='',i,d,cl;
 for(i=0;i<D.length;i++){d=D[i];if(!d)continue;
  cl='bw_i';if(i===idx)cl+=' bw_a';if(cp[d.n])cl+=' bw_c';
  h+='<div class="'+cl+'" data-i="'+i+'"><span class=bw_num>'+(i+1)+'</span><span class=bw_nm>'+esc(d.n)+'</span><span class=bw_ck>✓</span></div>';
 }
 L.innerHTML=h;
}

function rs(){var d=D[idx];if(!d)return;
 R.innerHTML='<div class=bw_tl>'+esc(d.n)+'</div><div class=bw_tx>'+nl2br(d.c)+'</div><button class=bw_btn id=__bw_btn>📋 复制 (Ctrl+C)</button>';
 var b=document.getElementById('__bw_btn');if(b)b.onclick=copy;
}

function rf(){var is=L.querySelectorAll('.bw_i'),i,d,cl;
 for(i=0;i<is.length;i++){d=D[i];if(!d)continue;cl='bw_i';if(i===idx)cl+=' bw_a';if(cp[d.n])cl+=' bw_c';is[i].className=cl;}rs();
}

function copy(){var d=D[idx];if(!d)return;
 var t=document.createElement('textarea');t.value=d.c;t.style.cssText='position:fixed;left:-9999px;top:-9999px';
 document.body.appendChild(t);t.focus();t.select();
 try{document.execCommand('copy')}catch(e){}document.body.removeChild(t);
 cp[d.n]=true;rf();
 var b=document.getElementById('__bw_btn');
 if(b){b.textContent='✅ '+esc(d.n);b.style.background='#22c55e';
  setTimeout(function(){var x=document.getElementById('__bw_btn');if(x){x.textContent='📋 复制 (Ctrl+C)';x.style.background=''}},1500);
 }
}

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function nl2br(s){return String(s||'').replace(/\\n/g,'<br>')}
function px(v){return Math.max(0,v)+'px'}

function savePos(){try{localStorage.setItem('__bw_pos',JSON.stringify({l:root.style.left,t:root.style.top,w:W.style.width,h:W.style.height}))}catch(e){}}
function loadPos(){try{var p=JSON.parse(localStorage.getItem('__bw_pos'));if(p){if(p.l)root.style.left=p.l;if(p.t)root.style.top=p.t;if(p.w)W.style.width=p.w;if(p.h)W.style.height=p.h}}catch(e){}}

function minimize(){
 minimized=true;root.style.display='none';
 if(!miniBtn){miniBtn=document.createElement('div');
  miniBtn.style.cssText='position:fixed;bottom:20px;right:20px;z-index:2147483641;width:42px;height:42px;background:linear-gradient(135deg,#7c3aed,#6366f1);border-radius:50%;box-shadow:0 4px 16px rgba(124,58,237,.4);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;transition:transform .15s';
  miniBtn.title='TABuddy 反馈书签 ('+D.length+' 人)';
  miniBtn.textContent='📋';
  miniBtn.onmouseenter=function(){this.style.transform='scale(1.1)'};
  miniBtn.onmouseleave=function(){this.style.transform='scale(1)'};
  miniBtn.onclick=function(){minimized=false;root.style.display='block';miniBtn.style.display='none'};
  document.body.appendChild(miniBtn);
 }
 miniBtn.style.display='block';
}

MIN.onclick=function(e){e.stopPropagation();minimize()};
CL.onclick=function(e){e.stopPropagation();destroy()};

L.addEventListener('click',function(e){var el=e.target;while(el&&el!==L){if(el.classList&&el.classList.contains('bw_i')){idx=parseInt(el.getAttribute('data-i')||0);rf();return}el=el.parentNode}},false);

HD.addEventListener('mousedown',function(e){
 if(e.target===MIN||e.target===CL||e.target.closest('.bw_close'))return;
 e.preventDefault();dx=e.clientX-root.offsetLeft;dy=e.clientY-root.offsetTop;root.style.right='auto';root.style.left=px(root.offsetLeft);root.style.top=px(root.offsetTop);
 function mv(e2){root.style.left=px(e2.clientX-dx);root.style.top=px(e2.clientY-dy)}
 function up(){document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);savePos()}
 document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);
});

RS.addEventListener('mousedown',function(e){
 e.preventDefault();e.stopPropagation();sx=e.clientX;sy=e.clientY;var ow=W.offsetWidth,oh=W.offsetHeight;
 function mv(e2){W.style.width=px(ow+e2.clientX-sx);W.style.height=px(oh+e2.clientY-sy)}
 function up(){document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);savePos()}
 document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);
});

rl();rs();loadPos();

function kd(e){
 if(!e)e=window.event;var k=e.key||e.keyCode||e.which||0;
 if(k==='Escape'||k===27){minimize();return}
 if(k==='ArrowDown'||k===40){e.preventDefault();e.stopPropagation();idx=Math.min(idx+1,D.length-1);rf();return}
 if(k==='ArrowUp'||k===38){e.preventDefault();e.stopPropagation();idx=Math.max(idx-1,0);rf();return}
 var n=-1;if(typeof k==='string'&&k>='1'&&k<='9')n=parseInt(k)-1;else if(k>=49&&k<=57)n=k-49;
 if(n>=0&&n<D.length){e.preventDefault();e.stopPropagation();idx=n;rf();return}
 if((e.ctrlKey||e.metaKey)&&(k==='c'||k==='C'||k===67)){e.preventDefault();e.stopPropagation();copy()}
}
document.addEventListener('keydown',kd,true);
}();
`.trim()

export function generateBookmarklet(students: BookmarkStudent[]): string {
  const mapped = students.map((s) => ({ n: s.name, c: s.content }))
  const dataJson = JSON.stringify(mapped)
  const code = BOOKMARK_SCRIPT.replace('__DATA__', dataJson)
  return 'javascript:' + code
}

export function generateBookmarkCode(students: BookmarkStudent[]): string {
  const mapped = students.map((s) => ({ n: s.name, c: s.content }))
  const dataJson = JSON.stringify(mapped)
  return BOOKMARK_SCRIPT.replace('__DATA__', dataJson)
}
