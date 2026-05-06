'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bookmark, Copy, Check, Download, ChevronRight, ExternalLink } from 'lucide-react'
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

const BOOKMARKLET_CODE = `(function(){if(window.__tabuddyAutoFill)return;window.__tabuddyAutoFill=true;var C='#tabuddy-panel{all:initial;position:fixed;top:20px;right:20px;z-index:999999;width:380px;max-height:90vh;background:#fff;border-radius:12px;box-shadow:0 8px 40px rgba(0,0,0,.18);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:14px;line-height:1.5;color:#333;display:flex;flex-direction:column;overflow:hidden;border:1px solid #e8e8e8}#tabuddy-panel *{all:revert;box-sizing:border-box}#tabuddy-panel .header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#4f46e5;color:#fff;font-weight:600;font-size:15px}#tabuddy-panel .header button{all:revert;background:none;border:none;color:#fff;font-size:20px;cursor:pointer;padding:0 4px;line-height:1}#tabuddy-panel .body{padding:12px 16px;overflow-y:auto;flex:1}#tabuddy-panel .section{margin-bottom:12px}#tabuddy-panel .section label{display:block;font-size:12px;font-weight:600;color:#666;margin-bottom:4px}#tabuddy-panel textarea{all:revert;width:100%;min-height:60px;padding:8px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px;font-family:monospace;resize:vertical}#tabuddy-panel textarea:focus{outline:none;border-color:#4f46e5}#tabuddy-panel .student-list{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px}#tabuddy-panel .student-list button{all:revert;padding:4px 10px;border-radius:14px;border:1px solid #ddd;background:#f5f5f5;cursor:pointer;font-size:12px}#tabuddy-panel .student-list button:hover{border-color:#4f46e5;color:#4f46e5}#tabuddy-panel .student-list button.active{background:#4f46e5;color:#fff;border-color:#4f46e5}#tabuddy-panel .preview-box{background:#f9f9fb;border-radius:6px;padding:10px;font-size:13px;color:#444;min-height:40px;max-height:120px;overflow-y:auto;white-space:pre-wrap;word-break:break-all}#tabuddy-panel .preview-box.empty{color:#bbb;font-style:italic}#tabuddy-panel .actions{display:flex;gap:6px;margin-top:8px}#tabuddy-panel .actions button{all:revert;flex:1;padding:8px 0;border-radius:6px;border:none;cursor:pointer;font-size:13px;font-weight:600}#tabuddy-panel .btn-primary{background:#4f46e5;color:#fff}#tabuddy-panel .btn-primary:hover{background:#4338ca}#tabuddy-panel .btn-primary:disabled{background:#a5b4fc;cursor:default}#tabuddy-panel .btn-secondary{background:#e5e7eb;color:#333}#tabuddy-panel .btn-secondary:hover{background:#d1d5db}#tabuddy-panel .status-bar{margin-top:8px;padding:6px 10px;border-radius:6px;font-size:12px;display:none}#tabuddy-panel .status-bar.success{display:block;background:#ecfdf5;color:#065f46}#tabuddy-panel .status-bar.error{display:block;background:#fef2f2;color:#991b1b}#tabuddy-panel .status-bar.info{display:block;background:#eff6ff;color:#1e40af}';function s(){var e=document.createElement('style');e.textContent=C;document.head.appendChild(e)}function h(t){var e=document.getElementById('tabuddy-status');if(!e)return;e.textContent=t;setTimeout(function(){e.style.display='none'},3000)}function f(){var a=document.querySelectorAll('button,a,[role="tab"],[role="button"]'),r=[],n=new Set;return a.forEach(function(e){var t=(e.textContent||'').trim();if(t.length>=2&&t.length<=6&&/^[\\u4e00-\\u9fa5a-zA-Z]+$/.test(t)&&!n.has(t)){n.add(t);r.push({name:t,el:e})}}),r}function l(t){var a=document.querySelectorAll('textarea'),r=[];return a.forEach(function(e){var n=e.parentElement,o=!1;for(var i=0;i<5;i++){if(!n)break;var c=n.querySelectorAll('label,span,div,h1,h2,h3,h4');for(var d=0;d<c.length;d++){if(c[d].textContent.indexOf(t)!==-1){o=!0;break}}if(o)break;n=n.parentElement}if(o)r.push(e)}),r}function p(e,t){e.value=t;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));e.dispatchEvent(new Event('blur',{bubbles:true}))}var x=document.createElement('div');x.id='tabuddy-panel';x.innerHTML='<div class="header"><span>📋 TABuddy 填写助手</span><button onclick="var p=document.getElementById(\\'tabuddy-panel\\');p.parentNode.removeChild(p);window.__tabuddyAutoFill=false">✕</button></div><div class="body"><div class="section"><label>📥 粘贴数据（从 TABuddy 复制）</label><textarea id="tabuddy-data-input" placeholder="在 TABuddy 点击「复制书签数据」，然后粘贴到这里..."></textarea></div><div class="section"><label>👤 选择学生</label><div class="student-list" id="tabuddy-students"></div></div><div class="section"><label>📝 反馈预览</label><div class="preview-box empty" id="tabuddy-preview">选择学生后显示反馈内容</div></div><div class="section"><label>🎯 填写目标</label><select id="tabuddy-target-field" style="width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-size:13px"><option value="课堂表现">课堂表现</option><option value="上节课练习情况">上节课练习情况</option><option value="建议练习">建议练习</option><option value="课中掌握情况">课中掌握情况</option><option value="课堂入门测">课堂入门测</option><option value="课堂出门测">课堂出门测</option><option value="custom">自定义选择器</option></select><input id="tabuddy-custom-selector" placeholder="输入 CSS 选择器" style="display:none;width:100%;margin-top:4px;padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-size:13px"></div><div class="actions"><button class="btn-secondary" id="tabuddy-btn-prev">← 上一个</button><button class="btn-primary" id="tabuddy-btn-fill" disabled>✏️ 填写</button><button class="btn-secondary" id="tabuddy-btn-next">下一个 →</button></div><div class="status-bar" id="tabuddy-status"></div></div>';s();document.body.appendChild(x);var cd=null,cs=[],ci=-1,di=document.getElementById('tabuddy-data-input'),sc=document.getElementById('tabuddy-students'),pv=document.getElementById('tabuddy-preview'),fb=document.getElementById('tabuddy-btn-fill'),pb=document.getElementById('tabuddy-btn-prev'),nb=document.getElementById('tabuddy-btn-next'),ts=document.getElementById('tabuddy-target-field'),cs2=document.getElementById('tabuddy-custom-selector');ts.addEventListener('change',function(){cs2.style.display=this.value==='custom'?'block':'none'});di.addEventListener('paste',function(){setTimeout(function(){var e=di.value.trim();if(!e)return;try{cd=JSON.parse(e);if(!cd.students||!Array.isArray(cd.students)){h('数据格式错误','error');return}cs=cd.students;sc.innerHTML='';cs.forEach(function(s,i){var b=document.createElement('button');b.textContent=s.name;b.onclick=function(){ci=i;var btns=sc.querySelectorAll('button');btns.forEach(function(bb,j){bb.className=j===i?'active':''});var st=cs[i];if(st&&st.feedback){pv.textContent=st.feedback;pv.className='preview-box';fb.disabled=false}else{pv.textContent='暂无反馈';pv.className='preview-box empty';fb.disabled=true}};sc.appendChild(b)});h('已加载 '+cs.length+' 名学生','success')}catch(e2){h('解析失败:'+e2.message,'error')}},100)});fb.addEventListener('click',function(){if(ci<0||!cs[ci])return;var s2=cs[ci],f2=ts.value;if(f2==='custom')f2=cs2.value.trim();if(!f2){h('请选择填写目标','error');return}var tas;if(ts.value==='custom'){var sel=cs2.value.trim();tas=sel?document.querySelectorAll(sel):[]}else{tas=l(f2)}if(!tas.length){h('未找到「'+f2+'」输入框','error');return}p(tas[0],s2.feedback);h('✅ 已填入「'+s2.name+'」','success')});pb.addEventListener('click',function(){if(!cs.length)return;var idx=ci<=0?cs.length-1:ci-1;ci=idx;var btns=sc.querySelectorAll('button');btns.forEach(function(b,i){b.className=i===idx?'active':''});var st=cs[idx];if(st&&st.feedback){pv.textContent=st.feedback;pv.className='preview-box';fb.disabled=false}else{pv.textContent='暂无反馈';pv.className='preview-box empty';fb.disabled=true}});nb.addEventListener('click',function(){if(!cs.length)return;var idx=ci>=cs.length-1?0:ci+1;ci=idx;var btns=sc.querySelectorAll('button');btns.forEach(function(b,i){b.className=i===idx?'active':''});var st=cs[idx];if(st&&st.feedback){pv.textContent=st.feedback;pv.className='preview-box';fb.disabled=false}else{pv.textContent='暂无反馈';pv.className='preview-box empty';fb.disabled=true}})})()`

function generateBookmarkletUrl(): string {
  return 'javascript:' + encodeURIComponent(BOOKMARKLET_CODE)
}

function generateBookmarkletHtml(): string {
  return `<a href="javascript:${encodeURIComponent(BOOKMARKLET_CODE)}" onclick="return false">📋 TABuddy 填写助手</a>`
}

export default function BookmarkletSetup({ isOpen, onClose, classTitle, students }: BookmarkletSetupProps) {
  const [bookmarkletUrl, setBookmarkletUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const dataRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen) {
      setBookmarkletUrl(generateBookmarkletUrl())
    }
  }, [isOpen])

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

  const handleCopyBookmarklet = useCallback(async () => {
    const url = bookmarkletUrl || generateBookmarkletUrl()
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('已复制！请添加到书签栏')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('复制失败，请手动拖拽按钮')
    }
  }, [bookmarkletUrl])

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
                  <p className="text-sm text-gray-500">书签脚本 · 一键填写混合学习中心</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              <div className="bg-indigo-50 rounded-xl p-4 space-y-3">
                <h3 className="font-medium text-indigo-900 flex items-center gap-1.5 text-sm">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                  首次安装：添加书签到书签栏
                </h3>
                <p className="text-sm text-indigo-700">
                  将下方按钮拖拽到浏览器书签栏（或右键 → 收藏）
                </p>

                <div
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData('text/uri-list', bookmarkletUrl || generateBookmarkletUrl())
                    e.dataTransfer.setData('text/plain', bookmarkletUrl || generateBookmarkletUrl())
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg shadow-sm border border-indigo-200 text-indigo-700 font-medium text-sm cursor-grab active:cursor-grabbing hover:bg-indigo-50 transition-colors select-none"
                >
                  <Bookmark className="w-4 h-4" />
                  📋 TABuddy 填写助手
                  <span className="text-xs text-gray-400 ml-1">（拖拽到书签栏）</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCopyBookmarklet}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? '已复制' : '复制书签代码'}
                  </button>
                </div>

                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-700">手动安装教程</summary>
                  <ol className="mt-2 pl-4 space-y-1 list-decimal text-gray-500">
                    <li>确保浏览器书签栏已显示（Chrome: Ctrl+Shift+B）</li>
                    <li>按住上方按钮，拖拽到书签栏后松开</li>
                    <li>或者右键按钮 → 点击「收藏链接」</li>
                  </ol>
                </details>
              </div>

              <div className="bg-green-50 rounded-xl p-4 space-y-3">
                <h3 className="font-medium text-green-900 flex items-center gap-1.5 text-sm">
                  <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                  每次使用：复制数据 → 点书签 → 填写
                </h3>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyData}
                    disabled={validCount === 0}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Copy className="w-4 h-4" />
                    复制书签数据
                    <span className="bg-green-500 px-1.5 py-0.5 rounded text-xs">{validCount} 人</span>
                  </button>
                </div>

                <div className="text-sm text-green-800 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5" />
                    打开混合学习中心的「个人学情反馈」页面
                  </p>
                  <p className="flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5" />
                    点击书签栏的「📋 TABuddy 填写助手」
                  </p>
                  <p className="flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5" />
                    在浮动面板中粘贴数据 → 选择学生 → 一键填写
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
