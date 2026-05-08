'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bookmark, Copy, ChevronRight, ExternalLink, AlertTriangle, MousePointer } from 'lucide-react'
import { toast } from 'sonner'

interface StudentFeedback {
  name: string
  feedback: string
}

interface BookmarkletSetupProps {
  isOpen: boolean
  onClose: () => void
  classTitle?: string
  students: StudentFeedback[]
}

const BOOKMARKLET_CODE = `(function(){if(window.__tabuddyAutoFill)return;window.__tabuddyAutoFill=true;var C='#tabuddy-panel{all:initial;position:fixed;top:20px;right:20px;z-index:999999;width:380px;max-height:90vh;background:#fff;border-radius:12px;box-shadow:0 8px 40px rgba(0,0,0,.18);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:14px;line-height:1.5;color:#333;display:flex;flex-direction:column;overflow:hidden;border:1px solid #e8e8e8}#tabuddy-panel *{all:revert;box-sizing:border-box}#tabuddy-panel .header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#4f46e5;color:#fff;font-weight:600;font-size:15px}#tabuddy-panel .header button{all:revert;background:none;border:none;color:#fff;font-size:20px;cursor:pointer;padding:0 4px;line-height:1}#tabuddy-panel .body{padding:12px 16px;overflow-y:auto;flex:1}#tabuddy-panel .section{margin-bottom:12px}#tabuddy-panel .section label{display:block;font-size:12px;font-weight:600;color:#666;margin-bottom:4px}#tabuddy-panel textarea{all:revert;width:100%;min-height:60px;padding:8px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px;font-family:monospace;resize:vertical}#tabuddy-panel textarea:focus{outline:none;border-color:#4f46e5}#tabuddy-panel .student-list{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px}#tabuddy-panel .student-list button{all:revert;padding:4px 10px;border-radius:14px;border:1px solid #ddd;background:#f5f5f5;cursor:pointer;font-size:12px}#tabuddy-panel .student-list button:hover{border-color:#4f46e5;color:#4f46e5}#tabuddy-panel .student-list button.active{background:#4f46e5;color:#fff;border-color:#4f46e5}#tabuddy-panel .preview-box{background:#f9f9fb;border-radius:6px;padding:10px;font-size:13px;color:#444;min-height:40px;max-height:120px;overflow-y:auto;white-space:pre-wrap;word-break:break-all}#tabuddy-panel .preview-box.empty{color:#bbb;font-style:italic}#tabuddy-panel .actions{display:flex;gap:6px;margin-top:8px}#tabuddy-panel .actions button{all:revert;flex:1;padding:8px 0;border-radius:6px;border:none;font-size:13px;font-weight:600;cursor:pointer;text-align:center}#tabuddy-panel .actions .btn-fill{background:#4f46e5;color:#fff}#tabuddy-panel .actions .btn-fill:hover{background:#4338ca}#tabuddy-panel .actions .btn-fill:disabled{background:#a5b4fc;cursor:not-allowed}#tabuddy-panel .actions .btn-prev{background:#e5e7eb;color:#374151;flex:0.4}#tabuddy-panel .actions .btn-next{background:#e5e7eb;color:#374151;flex:0.4}#tabuddy-panel .actions .btn-prev:hover{background:#d1d5db}#tabuddy-panel .actions .btn-next:hover{background:#d1d5db}';var s=document.createElement("style");s.textContent=C;document.head.appendChild(s);var p=document.createElement("div");p.id="tabuddy-panel";p.innerHTML='<div class="header"><span>\uD83D\uDCCB TABuddy \u586B\u5199\u52A9\u624B</span><button onclick="this.closest(\\'#tabuddy-panel\\').remove();window.__tabuddyAutoFill=false">\u2716</button></div><div class="body"><div class="section"><label>\u2714\uFE0F \u5DF2\u590D\u5236\u7684\u6570\u636E</label><textarea id="t-data" placeholder="\u5728 TABuddy \u4E2D\u70B9\u51FB\u300C\u590D\u5236\u4E66\u7B7E\u6570\u636E\u300D\uFF0C\u7136\u540E\u7C98\u8D34\u5230\u8FD9\u91CC..."></textarea></div><div class="section"><label>\uD83D\uDC65 \u5B66\u751F\u5217\u8868</label><div id="t-students" class="student-list"></div></div><div class="section"><label>\uD83D\uDCC4 \u586B\u5199\u5185\u5BB9\u9884\u89C8</label><div id="t-preview" class="preview-box empty">\u8BF7\u5148\u7C98\u8D34\u6570\u636E\u5E76\u9009\u62E9\u5B66\u751F</div></div><div class="section"><label>\uD83C\uDFAF \u76EE\u6807\u5B57\u6BB5</label><select id="t-field" style="width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-size:13px"><option value="\u8BFE\u5802\u8868\u73B0">\u8BFE\u5802\u8868\u73B0</option><option value="\u4E0A\u8282\u8BFE\u7EC3\u4E60\u60C5\u51B5">\u4E0A\u8282\u8BFE\u7EC3\u4E60\u60C5\u51B5</option><option value="\u5EFA\u8BAE\u7EC3\u4E60">\u5EFA\u8BAE\u7EC3\u4E60</option><option value="\u8BFE\u4E2D\u638C\u63E1\u60C5\u51B5">\u8BFE\u4E2D\u638C\u63E1\u60C5\u51B5</option><option value="\u8BFE\u5802\u5165\u95E8\u6D4B">\u8BFE\u5802\u5165\u95E8\u6D4B</option><option value="\u8BFE\u5802\u51FA\u95E8\u6D4B">\u8BFE\u5802\u51FA\u95E8\u6D4B</option></select></div><div class="actions"><button class="btn-prev" id="t-prev">\u2190 \u4E0A\u4E00\u4E2A</button><button class="btn-fill" id="t-fill" disabled>\u270F\uFE0F \u586B\u5199</button><button class="btn-next" id="t-next">\u4E0B\u4E00\u4E2A \u2192</button></div></div>';document.body.appendChild(p);var D=null,S=null,I=-1;var E=document.getElementById("t-data"),B=document.getElementById("t-students"),P=document.getElementById("t-preview"),F=document.getElementById("t-field"),FB=document.getElementById("t-fill"),PB=document.getElementById("t-prev"),NB=document.getElementById("t-next");function findStudentButtons(){var r=[];if(!D||!D.students)return r;var names=D.students.map(function(s){return s.name}),els=document.querySelectorAll("button,span,a,div,li");els.forEach(function(el){var t=el.textContent.trim();if(names.indexOf(t)!==-1){var r2=el.closest("div");if(r2&&r2.querySelector("button")){r2.style.outline="2px solid #4f46e5";r2.style.outlineOffset="2px";r.push({name:t,element:r2})}}});return r}function findTextareasByLabel(l){var textareas=document.querySelectorAll("textarea");var results=[];textareas.forEach(function(ta){var p=ta.parentElement;var found=false;for(var i=0;i<5;i++){if(!p)break;var labels=p.querySelectorAll("label,span,div,p,h1,h2,h3,h4");for(var j=0;j<labels.length;j++){if(labels[j].textContent.trim().indexOf(l)!==-1){results.push(ta);found=true;break}}if(found)break;p=p.parentElement}});return results}function fillTextarea(ta,text){if(!ta)return;var v=typeof ta.value!=="undefined"?ta.value:ta.textContent;if(v===text)return;var nativeInputValueSetter=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,"value").set;nativeInputValueSetter.call(ta,text);ta.dispatchEvent(new Event("input",{bubbles:true,cancelable:true}));ta.dispatchEvent(new Event("change",{bubbles:true,cancelable:true}));ta.dispatchEvent(new Event("blur",{bubbles:true}));setTimeout(function(){ta.dispatchEvent(new Event("input",{bubbles:true,cancelable:true}));ta.dispatchEvent(new Event("change",{bubbles:true,cancelable:true}))},100)}function renderStudents(){B.innerHTML="";if(!D||!D.students){P.textContent="\u8BF7\u5148\u7C98\u8D34\u6570\u636E";P.className="preview-box empty";return}var students=D.students;if(students.length===0){P.textContent="\u6570\u636E\u4E2D\u6CA1\u6709\u5B66\u751F";P.className="preview-box empty";return}students.forEach(function(s,i){var btn=document.createElement("button");btn.textContent=s.name;btn.onclick=function(){selectStudent(i)};if(i===I&&S&&S.name===s.name)btn.className="active";B.appendChild(btn)});if(I>=students.length)I=0;if(I>=0&&I<students.length)selectStudent(I);else selectStudent(0)}function selectStudent(i){if(!D||!D.students||i<0||i>=D.students.length)return;I=i;S=D.students[i];var btns=B.querySelectorAll("button");btns.forEach(function(b,j){b.className=j===i?"active":""});var feedback=S.feedback||"";if(feedback){P.textContent=feedback;P.className="preview-box"}else{P.textContent=S.name+"\u6682\u65E0\u53CD\u9988";P.className="preview-box empty"}FB.disabled=!feedback;fillToPage()}function fillToPage(){if(!S)return;var feedback=S.feedback;if(!feedback)return;var fieldLabel=F.value;var targets=findTextareasByLabel(fieldLabel);if(targets.length===0){P.textContent="\u672A\u627E\u5230\u6807\u7B7E\u4E3A\u201C"+fieldLabel+"\u201D\u7684\u6587\u672C\u6846\uFF0C\u8BF7\u786E\u8BA4\u662F\u5426\u5728\u6DF7\u5408\u5B66\u4E60\u4E2D\u5FC3\u9875\u9762";return}targets.forEach(function(ta){fillTextarea(ta,feedback)});P.textContent="\u2714 \u5DF2\u586B\u5199\u5230 "+fieldLabel+"\uFF1A"+feedback.substring(0,50)+(feedback.length>50?"...":"");P.className="preview-box"}E.addEventListener("input",function(){try{D=JSON.parse(E.value);renderStudents()}catch(e){P.textContent="\u6570\u636E\u683C\u5F0F\u4E0D\u6B63\u786E\uFF0C\u8BF7\u91CD\u65B0\u590D\u5236";P.className="preview-box empty"}});FB.addEventListener("click",fillToPage);PB.addEventListener("click",function(){if(I>0)selectStudent(I-1)});NB.addEventListener("click",function(){if(D&&D.students&&I<D.students.length-1)selectStudent(I+1)});renderStudents()})()`

function generateBookmarkletUrl(): string {
  return 'javascript:' + encodeURIComponent(BOOKMARKLET_CODE)
}

export default function BookmarkletSetup({ isOpen, onClose, classTitle, students }: BookmarkletSetupProps) {
  const [bookmarkletUrl] = useState(generateBookmarkletUrl)
  const dataRef = useRef<HTMLTextAreaElement>(null)

  const handleCopyData = useCallback(async () => {
    const data = JSON.stringify({
      className: classTitle || '',
      date: new Date().toISOString().split('T')[0],
      students: students.filter(s => s.feedback),
    }, null, 2)

    try {
      await navigator.clipboard.writeText(data)
      toast.success('已复制 ' + students.filter(s => s.feedback).length + ' 名学生的反馈数据')
    } catch {
      if (dataRef.current) {
        dataRef.current.value = data
        dataRef.current.select()
        document.execCommand('copy')
        toast.success('已复制数据')
      }
    }
  }, [students])

  const validCount = students.filter(s => s.feedback).length

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4"
          >
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Bookmark className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">自动填写助手</h2>
                  <p className="text-sm text-gray-500">一键填写混合学习中心反馈</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-5 space-y-5">

              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-red-800 mb-1">⚠️ 不要复制到地址栏/搜索框！</p>
                    <p className="text-red-700">书签代码<strong>不能粘贴到地址栏</strong>，需要用下面的正确方式安装到书签栏。</p>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-xl p-4 space-y-3">
                <h3 className="font-medium text-indigo-900 flex items-center gap-1.5 text-sm">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                  安装到书签栏
                </h3>

                <div className="flex items-center gap-2 text-sm text-indigo-700 bg-indigo-100/50 rounded-lg px-3 py-2">
                  <MousePointer className="w-4 h-4 flex-shrink-0" />
                  <span>拖拽下方按钮到书签栏，松开即可完成安装</span>
                </div>

                <div className="relative">
                  <div
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData('text/uri-list', bookmarkletUrl)
                      e.dataTransfer.setData('text/plain', bookmarkletUrl)
                    }}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-white rounded-lg shadow-md border-2 border-indigo-300 text-indigo-700 font-medium text-sm cursor-grab active:cursor-grabbing hover:bg-indigo-50 transition-colors select-none"
                  >
                    <Bookmark className="w-4 h-4" />
                    📋 TABuddy 填写助手
                  </div>
                  <div className="absolute -top-3 -right-2 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                    拖我！
                  </div>
                </div>

                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-700 font-medium">如果拖拽不成功，可以手动添加</summary>
                  <ol className="mt-2 pl-4 space-y-1.5 list-decimal text-gray-500">
                    <li>点击浏览器地址栏右侧的 <strong>⭐ 星号</strong>（收藏按钮）</li>
                    <li>名称填：<strong>📋 TABuddy 填写助手</strong></li>
                    <li>URL 填：<strong style={{wordBreak:'break-all', fontSize:'9px'}}>{bookmarkletUrl.substring(0, 60)}...</strong></li>
                    <li>
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(bookmarkletUrl)
                            toast.success('书签URL已复制，粘贴到收藏夹的网址栏')
                          } catch {
                            toast.error('复制失败，请手动输入')
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs mt-1 hover:bg-indigo-200"
                      >
                        <Copy className="w-3 h-3" />
                        复制完整URL
                      </button>
                    </li>
                  </ol>
                </details>
              </div>

              <div className="bg-green-50 rounded-xl p-4 space-y-3">
                <h3 className="font-medium text-green-900 flex items-center gap-1.5 text-sm">
                  <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                  每次使用步骤
                </h3>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyData}
                    disabled={validCount === 0}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Copy className="w-4 h-4" />
                    复制书签数据
                    <span className="bg-green-500 px-1.5 py-0.5 rounded text-xs">{validCount} 人</span>
                  </button>
                </div>

                <div className="bg-white rounded-lg p-3 text-sm text-green-800 space-y-2.5 border border-green-200">
                  <p className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-green-700 mt-0.5">1</span>
                    <span>打开 <strong>混合学习中心</strong> 的「个人学情反馈」页面</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-green-700 mt-0.5">2</span>
                    <span>点击浏览器书签栏的 <strong>「📋 TABuddy 填写助手」</strong></span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-green-700 mt-0.5">3</span>
                    <span>粘贴数据 → 选择学生 → 点击 <strong>「填写」</strong></span>
                  </p>
                </div>
              </div>

              <textarea
                ref={dataRef}
                className="w-full h-0 opacity-0 absolute pointer-events-none"
                readOnly
                tabIndex={-1}
                aria-hidden
              />

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <ExternalLink className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-900 mb-1">已包含的学生反馈</p>
                    {validCount === 0 ? (
                      <p className="text-gray-500">暂无反馈数据，请先生成反馈</p>
                    ) : (
                      <ul className="space-y-1">
                        {students.filter(s => s.feedback).map(s => (
                          <li key={s.name} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span>{s.name}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
