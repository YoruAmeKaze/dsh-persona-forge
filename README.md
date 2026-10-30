# Persona Forge

Persona Forge 是面向 `SnowLuma + qq-bridge + DSH` 生态的本地单用户人格资产运行时。当前仓库只保留一个人格包：蓝色大肥鱼（DeepSeek娘）。SnowLuma 负责个人 QQ 登录，qq-bridge 负责 OneBot 消息与 DSH 会话桥接，Persona Forge 负责 Prompt 和人格资产。

## 已完成的功能

- 人格资产包校验和当前人格原子切换。
- 人格资料来源、事实、可信度和冲突记录。
- 网页资料归一化与研究记录保存。
- 人格版本快照、版本比较、回滚和离线测试场景。
- 视觉素材元数据、下载校验、SHA-256 去重、用户确认状态和可发送素材筛选。
- Cordis 插件入口，通过 `system-prompt/assemble` 注入当前人格。
- qq-bridge 兼容导出：把结构化人格包生成 `roles/*.md`，并可同步当前角色状态。
- Schema v2 分层：背景、人际关系、事件记忆、用户记忆与研究事实分开管理。

## 由 DSH 负责的部分

DSH 负责宿主进程、Agent 和 Session 服务、DeepSeek 模型调用、Prompt 组装和 Session 重置或重建。SnowLuma 负责个人 QQ 登录，qq-bridge 负责 OneBot v11 消息收发和 QQ 媒体转发。本仓库不替换这两层。

## 本地验证

环境要求：Node.js 20 或更高版本。

```powershell
npm test
```

## 配置 DSH 与 QQ 桥接

### 1. 确认三个进程

你需要运行以下三个部分：

```text
SnowLuma（个人 QQ 登录）
    ↓ OneBot v11 WebSocket / HTTP
qq-bridge（QQ ↔ DSH）
    ↓ DSH Web API
DSH（Agent、Session、DeepSeek）
```

你已经完成 SnowLuma 和 qq-bridge 的连接，下一步从第 2 步开始。

### 2. 安装本地插件

将本仓库放在 DSH 工作区旁边，然后安装到 DSH profile：

```powershell
npx @deepseek-ai/dsh plugin --profile web add D:\vibeCoding\PersonaForge
```

安装输出中应出现类似以下内容：

```text
persona-forge link:D:/vibeCoding/PersonaForge
```

如果看到 `declares no dsh.bundle — installed as a plain dependency`，说明当前安装的目录还没有更新到包含 `dsh.bundle.patch` 的版本。重新执行上面的安装命令，然后重启 DSH。

### 3. 添加 Cordis 插件配置

在 DSH 使用的 Cordis 配置文件中加入本地插件：

```yaml
- id: persona-forge
  name: D:\vibeCoding\PersonaForge
  config:
    root: D:\vibeCoding\PersonaForge
```

`root` 指向 Persona Forge 数据目录，默认使用仓库根目录。

### 4. 保留 DSH 核心服务

至少需要保留以下服务：

- `@deepseek-ai/dsh-session`
- `@deepseek-ai/dsh-agent`
- `@deepseek-ai/dsh-agent-loop`
- `@deepseek-ai/dsh-system-prompt`
- `@deepseek-ai/dsh-session-persistence-jsonl`
- `@deepseek-ai/dsh-agent-presets`
- DSH Web API 或对应的 Web 宿主服务

不需要安装或启用 `@tencent-connect/dsh-qqbot`。Persona Forge 通过 DSH 的 `system-prompt/assemble` 扩展点注入人格 Prompt，QQ 消息由 qq-bridge 负责。

### 5. 配置 DeepSeek

先复制环境变量模板：

```powershell
Copy-Item .env.example .env
notepad .env
```

在 `.env` 中填写 `DEEPSEEK_API_KEY`。个人 QQ 的登录和连接由 SnowLuma 负责，不需要在 Persona Forge 中填写 QQ Bot 的 `AppID` 或 `AppSecret`。`.env` 已被 `.gitignore` 忽略，不会提交到仓库。

PowerShell 不会自动读取 `.env`，启动前需要加载变量：

```powershell
Get-Content .env | Where-Object { $_ -and -not $_.StartsWith('#') } | ForEach-Object {
  $name, $value = $_ -split '=', 2
  if ($name -and $value -ne $null) { Set-Item -Path "Env:$name" -Value $value }
}
```

也可以直接在当前 PowerShell 窗口设置：

```powershell
$env:DEEPSEEK_API_KEY = "你的 DeepSeek API Key"
```

DeepSeek 如果已经在 DSH 中配置，也可以沿用 DSH 的凭据设置；不要重复配置两套 Key。

### 6. 启动并验证

先启动 DSH Web，再启动 qq-bridge，最后通过 QQ 发送测试消息。检查 DSH 日志确认插件加载和 `system-prompt/assemble` 注册成功，并用新 Session 测试蓝色大肥鱼人格回复。

人格切换属于 Session 级别操作。修改 `active-persona.json` 或调用切换服务后，需要重置或重建相关 DSH Session，新人格 Prompt 才会生效。

## 运行时服务

Cordis 插件会提供 `ctx.get('personaForge')` 服务：

- `loadActive()`：读取当前人格。
- `switch(id, version)`：切换当前人格版本。
- `collectResearch(id, options)`：采集并保存网页研究资料。
- `downloadAsset(id, options)`：下载并登记视觉素材。
- `exportToQqBridge(id, bridgeRoot, options)`：将人格包导出为 qq-bridge 角色卡。
- `approveResearchFact(id, fact)`：将带来源的研究事实提升为已确认记忆。

DSH 可以通过自己的 command 或 tool 层暴露这些操作。本仓库没有额外发明命令协议。

## 与 qq-bridge 兼容

Persona Forge 负责自动生产人格内容，qq-bridge 负责 QQ、OneBot、owner 权限、Session 和消息策略。导出时只写入人格内容，不写入工具调用、潜水、唤醒或分条协议。

在 DSH 管理端或本地脚本中调用：

```js
const personaForge = ctx.get('personaForge')
await personaForge.exportToQqBridge(
  'da-fei-yu',
  'D:/QQ bridge/qq-bridge-0.2.1-r1',
  { roleName: '蓝色大肥鱼', activate: true },
)
```

生成结果：

```text
qq-bridge/roles/蓝色大肥鱼.md
qq-bridge/state/current-role.json
```

导出后重启或等待 qq-bridge 的角色文件热加载，再用 QQ 新建会话测试。qq-bridge 的 `ownerQQ` 和工具权限继续由桥接配置负责。

## 配置示例

完整示例见 [config/persona-forge.example.json](config/persona-forge.example.json)。

```json
{
  "root": "./",
  "defaultPersona": "da-fei-yu",
  "research": { "maxPageBytes": 2000000, "timeoutMs": 20000 },
  "assets": { "maxBytes": 10485760, "requireConfirmation": true }
}
```

## 目录结构

```text
PersonaForge/
├── active-persona.json
├── personas/
│   └── da-fei-yu/
│       ├── manifest.json
│       ├── identity/
│       ├── style/
│       ├── memory/
│       ├── research/
│       ├── assets/
│       └── tests/
├── src/
├── test/
└── docs/
```

## 真实环境验收清单

- [ ] DSH 能够无 Cordis 错误加载本地插件。
- [ ] `system-prompt/assemble` 收到当前人格 Prompt section。
- [ ] 新 DSH Session 使用蓝色大肥鱼人格风格回复。
- [ ] qq-bridge 能收到 SnowLuma 的 OneBot 消息并创建 DSH Session。
- [ ] QQ 私聊和群聊 Session 由 qq-bridge 正确隔离。
- [ ] 切换人格后，重置 Session 能够使用新版本 Prompt。
- [ ] 已确认的本地视觉素材能够通过 qq-bridge / OneBot 发送。
- [ ] 仓库没有提交 API Key、QQ Secret 或其他敏感凭据。

## 当前限制

以下项目需要在实际环境中完成：DSH 宿主加载插件、DeepSeek API 调用、qq-bridge 的 DSH API 连接、SnowLuma 的 QQ 消息收发、QQ 媒体发送，以及长对话人格稳定性和异常恢复验证。
