# Persona Schema V2

Schema v2 将稳定人格、角色背景、人际关系、运行时记忆和研究资料分层管理。

```text
identity/personality.md       稳定性格和价值观
identity/background.md        角色出处和背景
relationships/characters.json 角色关系数据
relationships/relationship-rules.md 关系反应规则
style/speech-rules.md         语言风格
memory/index.json             已确认的通用记忆
memory/events.json            事件记忆
memory/user-facts.json        用户相关记忆
research/facts.json           尚处研究阶段的事实
research/sources.json         来源和可信度
research/conflicts.json       冲突记录
```

旧的 Schema v1 人格包仍可加载。缺少 v2 文件时，运行时使用空背景、空关系和空分层记忆，不影响现有包。

研究事实需要经过 `approveResearchFact()` 才会进入 `memory/index.json` 并参与运行时 Prompt。研究原始记录不会自动注入 QQ 对话。

导出到 qq-bridge 时，只导出人格、背景、关系规则、语言风格和已确认记忆；工具调用、潜水、唤醒和消息分条规则继续由 qq-bridge preset 负责。
