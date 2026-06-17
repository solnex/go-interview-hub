// --- Go Web3 Interview Hub Frontend Application ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Core State
    let currentCategory = 'all';
    let searchQuery = '';
    let isPracticeMode = false;
    
    // Load mastered questions from localStorage safely
    let masteredQuestions = new Set();
    try {
        const stored = localStorage.getItem('mastered_questions');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                masteredQuestions = new Set(parsed);
            }
        }
    } catch (e) {
        console.error("Failed to load mastered questions:", e);
    }
    
    // Keep track of which cards are temporarily revealed in practice mode during this session
    const sessionRevealed = new Set();

    // 2. DOM Elements
    const questionsWrapper = document.getElementById('questions-wrapper');
    const searchInput = document.getElementById('search-input');
    const searchClearBtn = document.getElementById('search-clear-btn');
    const practiceModeToggle = document.getElementById('practice-mode-toggle');
    const categoryButtons = document.querySelectorAll('.nav-item');
    const currentCategoryTitle = document.getElementById('current-category-title');
    const resultsCount = document.getElementById('results-count');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    
    // Stats elements
    const statTotalCount = document.getElementById('stat-total-count');
    const statPracticeCompleted = document.getElementById('stat-practice-completed');
    
    // Category counters safely checked
    const counts = {
        all: (window.INTERVIEW_DATA || []).length,
        datastruct: (window.INTERVIEW_DATA || []).filter(q => q.category === '数据结构').length,
        flow: (window.INTERVIEW_DATA || []).filter(q => q.category === '流程控制').length,
        db: (window.INTERVIEW_DATA || []).filter(q => q.category === '数据库').length,
        perf: (window.INTERVIEW_DATA || []).filter(q => q.category === '性能优化').length,
        concurrent: (window.INTERVIEW_DATA || []).filter(q => q.category === '并发编程').length,
        advanced: (window.INTERVIEW_DATA || []).filter(q => q.category === '高级特性').length
    };

    // Helper to safely set text content of elements if they exist
    const safeSetText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    // 3. Initialize Stats and Badges
    function initStats() {
        if (statTotalCount) statTotalCount.textContent = (window.INTERVIEW_DATA || []).length;
        if (statPracticeCompleted) statPracticeCompleted.textContent = masteredQuestions.size;
        
        safeSetText('count-all', counts.all);
        safeSetText('count-datastruct', counts.datastruct);
        safeSetText('count-flow', counts.flow);
        safeSetText('count-db', counts.db);
        safeSetText('count-perf', counts.perf);
        safeSetText('count-concurrent', counts.concurrent);
        safeSetText('count-advanced', counts.advanced);
        
        // Also support older cached HTML with count-web3 if needed
        safeSetText('count-web3', (window.INTERVIEW_DATA || []).filter(q => q.category === 'Web3 核心').length);
    }

    // 4. Custom Markdown Renderer Settings (marked.js)
    marked.setOptions({
        gfm: true,
        breaks: true,
        headerIds: false,
        mangle: false
    });

    // Helper to escape html for copy code
    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Custom marked renderer to inject copy buttons and prevent translation corruption
    const renderer = new marked.Renderer();
    renderer.code = function(code, infostring, escaped) {
        let text = '';
        let lang = '';
        
        if (typeof code === 'object' && code !== null) {
            text = code.text || '';
            lang = code.lang || '';
        } else {
            text = code || '';
            lang = infostring || '';
        }
        
        lang = (lang || '').match(/\S*/)[0];
        const cleanCode = escapeHtml(text);
        return `<pre class="language-${lang} notranslate" translate="no"><button class="copy-code-btn" onclick="copyCodeBlock(this)"><i class="fa-regular fa-copy"></i> Copy</button><code class="language-${lang} notranslate" translate="no">${cleanCode}</code></pre>`;
    };
    renderer.codespan = function(code) {
        let text = typeof code === 'object' && code !== null ? code.text : code;
        return `<code class="notranslate" translate="no">${text}</code>`;
    };

    // Custom marked extensions for KaTeX rendering
    const inlineMath = {
        name: 'inlineMath',
        level: 'inline',
        start(src) { return src.indexOf('$'); },
        tokenizer(src, tokens) {
            // 1. Match block math inside inline text: $$...$$
            const blockMatch = src.match(/^\$\$\n?([\s\S]+?)\n?\$\$/);
            if (blockMatch) {
                return {
                    type: 'inlineMath',
                    raw: blockMatch[0],
                    text: blockMatch[1],
                    displayMode: true
                };
            }
            // 2. Match inline math: $...$
            const inlineMatch = src.match(/^\$((?!\$)[^$\n]+?)\$/);
            if (inlineMatch) {
                return {
                    type: 'inlineMath',
                    raw: inlineMatch[0],
                    text: inlineMatch[1],
                    displayMode: false
                };
            }
        },
        renderer(token) {
            if (typeof katex !== 'undefined') {
                try {
                    const html = katex.renderToString(token.text, { 
                        displayMode: token.displayMode || false, 
                        throwOnError: false 
                    });
                    return token.displayMode ? `<div class="katex-block">${html}</div>` : html;
                } catch (err) {
                    console.error("KaTeX inline error: ", err);
                    return token.raw;
                }
            }
            return token.raw;
        }
    };

    const blockMath = {
        name: 'blockMath',
        level: 'block',
        start(src) { return src.indexOf('$$'); },
        tokenizer(src, tokens) {
            // Match block math: $$...$$
            const match = src.match(/^\$\$\n?([\s\S]+?)\n?\$\$/);
            if (match) {
                return {
                    type: 'blockMath',
                    raw: match[0],
                    text: match[1]
                };
            }
        },
        renderer(token) {
            if (typeof katex !== 'undefined') {
                try {
                    const html = katex.renderToString(token.text, { displayMode: true, throwOnError: false });
                    return `<div class="katex-block">${html}</div>`;
                } catch (err) {
                    console.error("KaTeX block error: ", err);
                    return `<pre class="katex-error">${token.raw}</pre>`;
                }
            }
            return `<pre class="katex-raw">${token.raw}</pre>`;
        }
    };

    marked.use({
        renderer,
        extensions: [blockMath, inlineMath]
    });

    // 5. Render Questions Function
    function renderQuestions() {
        // Filter questions
        const filtered = window.INTERVIEW_DATA.filter(q => {
            const matchesCategory = (currentCategory === 'all' || q.category === currentCategory);
            
            // Search inside title, id, core_answer text, and content body
            const cleanSearch = searchQuery.trim().toLowerCase();
            const matchesSearch = !cleanSearch || 
                q.title.toLowerCase().includes(cleanSearch) ||
                q.id.toLowerCase().includes(cleanSearch) ||
                (q.core_answer && q.core_answer.text.toLowerCase().includes(cleanSearch)) ||
                (q.content && q.content.toLowerCase().includes(cleanSearch));
                
            return matchesCategory && matchesSearch;
        });

        // Update titles and badge count
        currentCategoryTitle.textContent = currentCategory === 'all' ? '全部面试题' : currentCategory;
        resultsCount.textContent = `共 ${filtered.length} 条`;

        // Clear wrapper
        questionsWrapper.innerHTML = '';

        if (filtered.length === 0) {
            questionsWrapper.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-magnifying-glass-blur"></i>
                    <span>未找到匹配的面试题</span>
                </div>
            `;
            return;
        }

        // Render card elements
        filtered.forEach(q => {
            const isMastered = masteredQuestions.has(q.id);
            const isRevealed = sessionRevealed.has(q.id);
            
            // Card container classes
            let cardClasses = ['question-card'];
            if (isPracticeMode) {
                cardClasses.push('practice-active');
                if (isMastered) cardClasses.push('practice-mastered');
                if (isRevealed) cardClasses.push('practice-revealed');
            }

            // Render core answer html
            let coreAnswerHtml = '';
            if (q.core_answer && q.core_answer.text) {
                const type = q.core_answer.type || 'tip';
                let iconClass = 'fa-lightbulb';
                let typeLabel = '核心提示';
                
                if (type === 'important') { iconClass = 'fa-circle-exclamation'; typeLabel = '核心回答'; }
                else if (type === 'caution') { iconClass = 'fa-triangle-exclamation'; typeLabel = '高能避坑'; }
                else if (type === 'warning') { iconClass = 'fa-circle-radiation'; typeLabel = '生产风险'; }
                else if (type === 'note') { iconClass = 'fa-sticky-note'; typeLabel = '技术备注'; }

                const renderedText = marked.parse(q.core_answer.text);
                coreAnswerHtml = `
                    <div class="core-answer-box ${type}">
                        <div class="core-answer-title">
                            <i class="fa-solid ${iconClass}"></i> ${typeLabel}
                        </div>
                        <div class="core-answer-text">${renderedText}</div>
                    </div>
                `;
            }

            // Render full details html
            let detailsHtml = '';
            if (q.content) {
                const renderedContent = marked.parse(q.content);
                detailsHtml = `
                    <div class="details-area">
                        <div class="markdown-body">${renderedContent}</div>
                    </div>
                `;
            }

            // Card HTML structure
            const cardHtml = `
                <div class="${cardClasses.join(' ')}" data-id="${q.id}" data-category="${q.category}">
                    <div class="card-header">
                        <div class="card-title-group">
                            <span class="card-number">${q.id}</span>
                            <h4 class="card-title">${q.title}</h4>
                        </div>
                        <div class="card-tags">
                            <span class="tag-category">${q.category}</span>
                            <span class="practice-indicator">
                                <i class="fa-solid ${isMastered ? 'fa-circle-check' : 'fa-circle-question'}"></i> 
                                ${isMastered ? '已掌握' : '未掌握'}
                            </span>
                        </div>
                    </div>
                    
                    <!-- Core Answer Block -->
                    ${coreAnswerHtml}

                    <!-- Expandable Details Area -->
                    ${detailsHtml}

                    <!-- Practice Mode Prompt Box -->
                    <div class="practice-prompt-box">
                        <i class="fa-solid fa-eye"></i> 点击卡片揭晓核心回答与解析
                    </div>

                    <!-- Practice Mode Action Buttons -->
                    <div class="practice-actions">
                        <button class="practice-btn btn-mastered" onclick="markMastered(event, '${q.id}', true)">
                            <i class="fa-solid fa-check"></i> 我已掌握
                        </button>
                        <button class="practice-btn btn-again" onclick="markMastered(event, '${q.id}', false)">
                            <i class="fa-solid fa-rotate-left"></i> 还需要复习
                        </button>
                    </div>

                    <!-- Normal Mode Expand Toggle Bar -->
                    <div class="card-expand-bar">
                        <span>展开深度解析 <i class="fa-solid fa-chevron-down"></i></span>
                    </div>
                </div>
            `;
            
            questionsWrapper.insertAdjacentHTML('beforeend', cardHtml);
        });

        // Trigger Prism syntax highlighting on new DOM content
        Prism.highlightAll();
    }

    // 6. Interactive Event Handlers

    // Card click (to expand details or reveal practice answers)
    questionsWrapper.addEventListener('click', (e) => {
        // Skip clicks on action buttons or copy code button
        if (e.target.closest('.practice-actions') || e.target.closest('.copy-code-btn') || e.target.closest('pre')) {
            return;
        }

        const card = e.target.closest('.question-card');
        if (!card) return;

        const qId = card.getAttribute('data-id');

        if (isPracticeMode) {
            // In Practice Mode, click to reveal
            if (!sessionRevealed.has(qId)) {
                sessionRevealed.add(qId);
                card.classList.add('practice-revealed');
            }
        } else {
            // In Normal Mode, click to expand/collapse
            const isExpanded = card.classList.contains('expanded');
            card.classList.toggle('expanded');
            
            const expandTextSpan = card.querySelector('.card-expand-bar span');
            if (isExpanded) {
                expandTextSpan.innerHTML = `展开深度解析 <i class="fa-solid fa-chevron-down"></i>`;
            } else {
                expandTextSpan.innerHTML = `收起深度解析 <i class="fa-solid fa-chevron-down"></i>`;
            }
        }
    });

    // Practice button actions (Mark Mastered / Study Again)
    window.markMastered = (event, id, isMastered) => {
        event.stopPropagation(); // Stop card click handler
        
        if (isMastered) {
            masteredQuestions.add(id);
        } else {
            masteredQuestions.delete(id);
            // Hide the card again by removing it from the session revealed set
            sessionRevealed.delete(id);
        }
        
        localStorage.setItem('mastered_questions', JSON.stringify(Array.from(masteredQuestions)));
        initStats();
        renderQuestions();
    };

    // Copy code blocks utility
    window.copyCodeBlock = (btn) => {
        const pre = btn.parentNode;
        const code = pre.querySelector('code');
        navigator.clipboard.writeText(code.innerText).then(() => {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = `<i class="fa-solid fa-check" style="color: #10b981;"></i> Copied!`;
            setTimeout(() => {
                btn.innerHTML = originalHTML;
            }, 2000);
        });
    };

    // Category filtering
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentCategory = btn.getAttribute('data-category');
            renderQuestions();
        });
    });

    // Realtime search filtering
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (searchQuery.trim().length > 0) {
            searchClearBtn.style.display = 'block';
        } else {
            searchClearBtn.style.display = 'none';
        }
        renderQuestions();
    });

    // Clear search query
    searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        searchClearBtn.style.display = 'none';
        renderQuestions();
    });

    // Practice Mode toggling
    practiceModeToggle.addEventListener('change', (e) => {
        isPracticeMode = e.target.checked;
        sessionRevealed.clear(); // Reset revealed cards state
        renderQuestions();
    });

    // Dark/Light Theme toggling
    const currentTheme = localStorage.getItem('theme') || 'dark';
    if (currentTheme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        themeToggleBtn.innerHTML = `<i class="fa-solid fa-sun" style="color: #eab308;"></i>`;
    }

    themeToggleBtn.addEventListener('click', () => {
        if (document.body.classList.contains('dark-theme')) {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
            themeToggleBtn.innerHTML = `<i class="fa-solid fa-sun" style="color: #eab308;"></i>`;
        } else {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
            themeToggleBtn.innerHTML = `<i class="fa-solid fa-moon"></i>`;
        }
    });

    // 7. Fire it up!
    initStats();
    renderQuestions();
});
