@echo off
chcp 65001 > nul
title AI写作助手

echo.
echo ==========================================
echo          AI写作助手 v2.0 - 启动程序
echo ==========================================
echo.

cd /d "%~dp0"

echo 🚀 正在启动AI写作助手...
echo.

:: 检查核心文件
if not exist "index.html" (
    echo ❌ 错误：找不到index.html文件
    echo 请确保文件完整性
    pause
    exit /b 1
)

:: 网络连接检测
ping -n 1 cdn.tailwindcss.com >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 网络连接正常，启动现代化界面...
    start "" "index-modern.html"
    
    :: 同时打开辅助界面
    timeout /t 2 /nobreak >nul
    echo 📚 打开辅助界面...
    start "" "dashboard.html"
    start "" "templates.html"
    
) else (
    echo ⚠️  网络连接受限，启动离线版...
    
    :: 如果离线版不存在，创建一个简化版
    if not exist "index-simple.html" (
        echo 📝 创建离线版界面...
        call :create_simple_version
    )
    
    start "" "index-simple.html"
    start "" "测试界面.html"
)

echo.
echo ✅ 启动完成！
echo.
echo 💡 提示：
echo    - 如果界面无法正常显示，请关闭防火墙或更换网络
echo    - 建议使用Chrome或Edge浏览器
echo    - 文档会自动保存到浏览器本地存储
echo.
timeout /t 3 /nobreak >nul
exit /b 0

:create_simple_version
(
echo ^<!DOCTYPE html^>
echo ^<html lang="zh-CN"^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo     ^<title^>AI写作助手 - 简化版^</title^>
echo     ^<style^>
echo         * { margin: 0; padding: 0; box-sizing: border-box; }
echo         body { 
echo             font-family: 'Microsoft YaHei', sans-serif; 
echo             background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
echo             min-height: 100vh; padding: 20px; color: #333; 
echo         }
echo         .container { max-width: 1200px; margin: 0 auto; }
echo         .header { 
echo             background: rgba(255,255,255,0.95); 
echo             border-radius: 12px; padding: 20px; 
echo             text-align: center; margin-bottom: 20px;
echo         }
echo         .main-area { 
echo             background: rgba(255,255,255,0.95); 
echo             border-radius: 12px; padding: 20px; 
echo             min-height: 500px; display: flex; flex-direction: column;
echo         }
echo         .toolbar { 
echo             display: flex; gap: 10px; margin-bottom: 15px; 
echo             flex-wrap: wrap; justify-content: center;
echo         }
echo         .btn { 
echo             background: #4f46e5; color: white; border: none; 
echo             padding: 8px 16px; border-radius: 6px; cursor: pointer; 
echo             font-size: 14px; transition: all 0.3s;
echo         }
echo         .btn:hover { background: #4338ca; transform: translateY(-1px); }
echo         .editor { 
echo             width: 100%%; height: 400px; border: 2px solid #e2e8f0; 
echo             border-radius: 8px; padding: 15px; font-size: 14px; 
echo             resize: vertical; outline: none;
echo         }
echo         .editor:focus { border-color: #4f46e5; }
echo         .status { 
echo             display: flex; justify-content: space-between; 
echo             margin-top: 10px; font-size: 12px; color: #666;
echo         }
echo         .offline-badge { 
echo             background: #f59e0b; color: white; padding: 2px 8px; 
echo             border-radius: 10px; font-size: 10px; margin-left: 10px;
echo         }
echo     ^</style^>
echo ^</head^>
echo ^<body^>
echo     ^<div class="container"^>
echo         ^<div class="header"^>
echo             ^<h1^>🚀 AI写作助手 ^<span class="offline-badge"^>离线版^</span^>^</h1^>
echo             ^<p^>网络连接受限，已启用离线模式。支持基础写作和本地存储。^</p^>
echo         ^</div^>
echo         
echo         ^<div class="main-area"^>
echo             ^<div class="toolbar"^>
echo                 ^<button class="btn" onclick="newDocument()"^>📝 新建^</button^>
echo                 ^<button class="btn" onclick="saveDocument()"^>💾 保存^</button^>
echo                 ^<button class="btn" onclick="loadDocument()"^>📁 加载^</button^>
echo                 ^<button class="btn" onclick="exportDocument()"^>📤 导出^</button^>
echo                 ^<button class="btn" onclick="insertTemplate()"^>📋 模板^</button^>
echo                 ^<button class="btn" onclick="clearAll()"^>🗑️ 清空^</button^>
echo             ^</div^>
echo             
echo             ^<textarea id="editor" class="editor" placeholder="在这里开始您的创作...

离线版支持：
• 本地存储文档
• 基础编辑功能
• 文档导出
• 写作模板

提示：内容会自动保存到浏览器本地存储。"^></textarea^>
echo             
echo             ^<div class="status"^>
echo                 ^<span id="word-count"^>字数: 0^</span^>
echo                 ^<span id="save-status"^>准备就绪^</span^>
echo             ^</div^>
echo         ^</div^>
echo     ^</div^>
echo     
echo     ^<script^>
echo         let currentDoc = null;
echo         
echo         // 初始化
echo         document.addEventListener('DOMContentLoaded', function() {
echo             updateWordCount();
echo             loadLastDocument();
echo             
echo             // 自动保存
echo             document.getElementById('editor').addEventListener('input', function() {
echo                 updateWordCount();
echo                 clearTimeout(window.autoSaveTimer);
echo                 document.getElementById('save-status').textContent = '正在编辑...';
echo                 
echo                 window.autoSaveTimer = setTimeout(() =^> {
echo                     autoSave();
echo                 }, 3000);
echo             });
echo         });
echo         
echo         function updateWordCount() {
echo             const content = document.getElementById('editor').value;
echo             const count = content.replace(/\s/g, '').length;
echo             document.getElementById('word-count').textContent = '字数: ' + count;
echo         }
echo         
echo         function newDocument() {
echo             if (document.getElementById('editor').value ^&^& !confirm('当前内容未保存，确定要新建文档吗？')) {
echo                 return;
echo             }
echo             document.getElementById('editor').value = '';
echo             currentDoc = null;
echo             document.getElementById('save-status').textContent = '新文档';
echo             updateWordCount();
echo         }
echo         
echo         function saveDocument() {
echo             const content = document.getElementById('editor').value;
echo             if (!content.trim()) {
echo                 alert('内容为空，无需保存');
echo                 return;
echo             }
echo             
echo             const title = prompt('请输入文档标题:', '文档_' + new Date().toISOString().slice(0,10));
echo             if (!title) return;
echo             
echo             const docs = JSON.parse(localStorage.getItem('documents') || '{}');
echo             docs[title] = {
echo                 content: content,
echo                 savedAt: new Date().toISOString()
echo             };
echo             
echo             localStorage.setItem('documents', JSON.stringify(docs));
echo             currentDoc = title;
echo             document.getElementById('save-status').textContent = '已保存: ' + title;
echo             
echo             setTimeout(() =^> {
echo                 document.getElementById('save-status').textContent = '准备就绪';
echo             }, 2000);
echo         }
echo         
echo         function loadDocument() {
echo             const docs = JSON.parse(localStorage.getItem('documents') || '{}');
echo             const titles = Object.keys(docs);
echo             
echo             if (titles.length === 0) {
echo                 alert('没有保存的文档');
echo                 return;
echo             }
echo             
echo             const title = prompt('请选择要加载的文档:\n\n' + titles.map((t, i) =^> `${i+1}. ${t}`).join('\n'));
echo             if (title ^&^& docs[title]) {
echo                 document.getElementById('editor').value = docs[title].content;
echo                 currentDoc = title;
echo                 document.getElementById('save-status').textContent = '已加载: ' + title;
echo                 updateWordCount();
echo             }
echo         }
echo         
echo         function loadLastDocument() {
echo             const docs = JSON.parse(localStorage.getItem('documents') || '{}');
echo             const titles = Object.keys(docs);
echo             if (titles.length ^> 0) {
echo                 const lastDoc = titles[titles.length - 1];
echo                 if (confirm('是否加载上次编辑的文档: ' + lastDoc + '?')) {
echo                     document.getElementById('editor').value = docs[lastDoc].content;
echo                     currentDoc = lastDoc;
echo                     updateWordCount();
echo                 }
echo             }
echo         }
echo         
echo         function autoSave() {
echo             if (currentDoc) {
echo                 const content = document.getElementById('editor').value;
echo                 const docs = JSON.parse(localStorage.getItem('documents') || '{}');
echo                 docs[currentDoc].content = content;
echo                 docs[currentDoc].savedAt = new Date().toISOString();
echo                 localStorage.setItem('documents', JSON.stringify(docs));
echo                 document.getElementById('save-status').textContent = '自动保存完成';
echo             }
echo         }
echo         
echo         function exportDocument() {
echo             const content = document.getElementById('editor').value;
echo             if (!content.trim()) {
echo                 alert('内容为空，无法导出');
echo                 return;
echo             }
echo             
echo             const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
echo             const url = window.URL.createObjectURL(blob);
echo             const a = document.createElement('a');
echo             a.href = url;
echo             a.download = (currentDoc || '文档') + '.txt';
echo             document.body.appendChild(a);
echo             a.click();
echo             document.body.removeChild(a);
echo             window.URL.revokeObjectURL(url);
echo             
echo             document.getElementById('save-status').textContent = '已导出';
echo         }
echo         
echo         function insertTemplate() {
echo             const templates = {
echo                 '小说': '标题：[小说标题]\n\n第一章 相遇\n\n[描述主角登场和初始情况]\n\n[描述故事背景]\n\n[描述关键事件]\n\n第二章 发展\n\n[故事情节展开]\n\n[人物关系发展]\n\n[冲突出现]\n\n第三章 高潮\n\n[故事达到顶点]\n\n[解决主要冲突]\n\n第四章 结局\n\n[故事收尾]\n\n[人物命运安排]\n\n[主题升华]\n',
echo                 '散文': '标题：[散文标题]\n\n[开篇场景描写]\n\n[情感引入和主题提出]\n\n\n[主体部分：叙事、抒情、议论]\n\n[个人感悟和思考]\n\n\n[结尾：总结升华]\n\n[余韵和想象空间]\n',
echo                 '议论文': '标题：[议论文标题]\n\n一、引言\n[提出问题，表明观点]\n\n二、论证\n\n论据一：[具体事实或数据]\n[分析和说明]\n\n论据二：[案例或引证]\n[深入分析]\n\n论据三：[对比或类比]\n[强化论证]\n\n三、结论\n[总结观点]\n[提出建议或展望]\n'
echo             };
echo             
echo             const type = prompt('选择模板类型:\n1. 小说\n2. 散文\n3. 议论文');
echo             if (type ^&^& templates[['小说', '散文', '议论文'][parseInt(type)-1]]) {
echo                 const template = templates[['小说', '散文', '议论文'][parseInt(type)-1]];
echo                 document.getElementById('editor').value = template;
echo                 updateWordCount();
echo             }
echo         }
echo         
echo         function clearAll() {
echo             if (confirm('确定要清空所有内容吗？')) {
echo                 document.getElementById('editor').value = '';
echo                 currentDoc = null;
echo                 updateWordCount();
echo                 document.getElementById('save-status').textContent = '已清空';
echo             }
echo         }
echo     ^</script^>
echo ^</body^>
echo ^</html^>
) > "index-simple.html"
exit /b