# 闪记卡系统设计：从 CSV 到 AI 私人助理

> 基于本仓库的 React + Supabase 闪记卡应用，拆解系统设计，并延展到 AI 时代如何把它进化成懂你的学习 Agent。

## 1. 重新思考闪记卡的价值

- **输入门槛低**：CSV 拖拽即可生成学习材料，极适合把 Notion/Obsidian/Excel 的笔记快速转成卡片。
- **分层体验**：Landing Page 的营销叙事、`Library` 的统计面板、`RelationshipGraph` 的知识地图，支撑从新手到重度学习者的不同入口。
- **AI-ready**：本地 `localStorage` + 云端 Supabase 双模存储、SRS 数据埋点，为后续 AI 推荐、Agent Tooling 留下可扩展的“结构化地基”。

## 2. 系统架构快照

### 2.1 前端骨架
- `App.jsx` 充当状态编排器：管理上传 → 映射 → 复习的步骤机，以及 `user`/`studySession` 等核心状态。
- `import.meta.glob` 预置默认 CSV，保证新用户开箱即用，并且统一由 `parseCSV` 把数据整理为 `{ headers, data }` 结构。

### 2.2 数据入口：从 CSV 到标准卡片
1. `FileUpload` 负责拖拽/选择文件，并通过 `handleFileUpload` 触发解析。
2. `ColumnMapper` 允许分别映射题面、答案、分类或自定义标签，确保后续统计、过滤都能命中。
3. `handleImport` 输出统一的卡片模型 `{ front, back, category, tags, difficulty, lastReviewed }`，与 Supabase 表结构一一对齐。

### 2.3 本地缓存 + 云端协作
- `src/utils/storage.js` 用浏览器 `localStorage` 作为离线 fallback。
- 当登录后，`cardService` 直接对 Supabase `flashcards` 表执行 CRUD，保证不同设备间自动同步。
- `onSync` 支持把离线卡片一次性推送到云端，为“移动端离线背”到“桌面端复盘”提供无缝体验。

### 2.4 复习中台
- `Library` 聚合统计、筛选器、批量操作与 `SRS` 模式切换；`TagSidebar` 做多维度过滤，`RelationshipGraph` 用 canvas 力导布局呈现知识簇。
- `Flashcard` + `Controls` 提供键盘/手势友好的复习交互，`handleDifficulty` 会实时更新卡片状态并把“Hard”卡重排到队尾。

## 3. SRS 大脑怎么落地

应用采用轻量的 Ebbinghaus/SM-2 混合策略，通过 `calculateNextReview` 计算每次评分后的下一次复习日期与间隔：

```4:29:src/utils/srsAlgorithm.js
export const calculateNextReview = (currentInterval, rating) => {
    // rating: 'easy', 'medium', 'hard'
    // currentInterval: days since last review (or 0 if new)

    let nextInterval = 1;

    if (rating === 'hard') {
        // Reset or keep short
        nextInterval = 1;
    } else if (rating === 'medium') {
        // 1.5x expansion or minimum 2 days
        nextInterval = Math.max(2, Math.ceil(currentInterval * 1.5));
    } else if (rating === 'easy') {
        // 2.5x expansion or minimum 4 days
        if (currentInterval === 0) nextInterval = 4;
        else nextInterval = Math.ceil(currentInterval * 2.5);
    }

    // Calculate date
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + nextInterval);

    return {
        nextReviewDate: nextDate.toISOString(),
        interval: nextInterval
    };
};
```

对应的云端调度则由 `cardService.getDueCards` 完成：先查 `next_review_date <= now` 的到期卡片，再用 `review_count = 0` 的新卡补齐配额，形成自动化的“今日待办”：

```76:112:src/services/cardService.js
async getDueCards(user, limit = 20) {
    if (!user) return [];

    const now = new Date().toISOString();

    const { data: dueCards } = await supabase
        .from('flashcards')
        .select('*')
        .lte('next_review_date', now)
        .order('next_review_date', { ascending: true })
        .limit(limit);

    let cards = dueCards || [];

    if (cards.length < limit) {
        const remaining = limit - cards.length;
        const { data: newCards } = await supabase
            .from('flashcards')
            .select('*')
            .eq('review_count', 0)
            .limit(remaining);

        if (newCards) {
            cards = [...cards, ...newCards];
        }
    }

    return cards.map(card => ({
        ...card,
        category: card.tags && card.tags.length > 0 ? card.tags[0] : 'Uncategorized'
    }));
}
```

## 4. 面向 AI 的系统演进

1. **结构化知识库**  
   - 利用 Supabase 中的 `front/back/tags/review_count` 做主数据；定期导出为 JSONL，或者直接在 Edge Function 里把每张卡写入向量库（如 Supabase Vector、Pinecone）。  
   - 以“卡片→知识单元→语义 embedding”形成可检索的 RAG 素材，供 Agent 在对话中引用。

2. **Agent 工具化**  
   - 把 `cardService` 的方法包装成 Agent 的 Tool：如 `ListDueCards`, `AddCard`, `ScoreCard`，Agent 可以根据上下文调用这些 API 来同步学习进度。  
   - 通过 LangChain / Autogen / LlamaIndex 配置一个多工具 Agent：`search_notes`（RAG）、`schedule_review`（SRS 查询）、`summarize_csv`（LLM 解析新资料）。

3. **个性化策略层**  
   - 在 `handleDifficulty` 里新增埋点：记录用户对某类知识的掌握波动，Agent 可据此动态改写提示词（如“更偏好举例式解释”）。  
   - 结合 `RelationshipGraph` 的拓扑，把类别视作知识簇，让 Agent 优先推荐与“薄弱簇”相关的卡片或生成新的练习题。

## 5. 训练 / 微调你的私人学习助理

1. **数据蒸馏**：把每次复习的问答对、难度评价、复盘笔记（可新增字段）整理成指令数据，格式如 `{"instruction": "帮助我复习", "input": "...卡片数据...", "output": "...Agent 回答..."}`。  
2. **知识增强**：用 LLM 自动生成相似题、反向问答、类比故事，扩充训练样本，缓解小数据问题。  
3. **LoRA / QLoRA 微调**：选择开源基座（Qwen2.5, Llama 3.1 等），针对上一步的数据做参数高效微调，部署在本地 GPU 或云端推理服务。  
4. **对齐与评估**：利用 Supabase 的行级安全（RLS）和审计日志，记录 Agent 建议与真实学习表现的差，其结果既能反馈微调，也能驱动在线强化（RLHF/Offline RL）。

## 6. 本地运行与云服务

```bash
npm install
npm run dev
```

- 环境变量：在 `.env` 中配置 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY` 即可启用登录、同步、SRS 查询。  
- GitHub Actions (`.github/workflows/deploy.yml`) 已配置 Vite 项目自动构建，推送到 `main` 即可上 GitHub Pages。

## 7. 后续演进建议

- **AI 生成卡片**：新增一个 `generateFromText` 服务，把论文 / 网课字幕上传后由 LLM 自动抽取 QA。  
- **学习节奏洞察**：结合 Supabase Edge Functions 定时扫描 `next_review_date`，推送提醒或生成“本周知识热力图”。  
- **多 Agent 协作**：拆分“资料整理 Agent”“复习导师 Agent”“情绪陪伴 Agent”，分别调用不同工具，在会话中协同完成自适应教学。

借助目前已经打好的数据模型与前端交互，你可以把这个闪记卡项目当作“学习 OS”，再叠加 AI Agent / 模型微调，把所有学习资产持续沉淀为懂你的私人助理。
