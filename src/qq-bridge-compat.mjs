import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadPersona } from './persona-runtime.mjs';

function renderRole(persona) {
  return [
    `# 角色卡：${persona.manifest.name}`,
    '',
    '## 一、你是谁',
    persona.personality.trim(),
    ...(persona.background.trim() ? ['', '## 二、角色背景', persona.background.trim()] : []),
    ...(persona.relationships.items?.length ? ['', '## 三、人际关系', JSON.stringify(persona.relationships, null, 2)] : []),
    ...(persona.relationshipRules.trim() ? ['', '## 四、关系反应', persona.relationshipRules.trim()] : []),
    '',
    '## 五、说话风格',
    persona.style.trim(),
    '',
    '## 六、人格边界',
    '- 这是社区二创人格设定，不代表官方身份。',
    '- 不把未经来源支持的传闻、经历或引语说成事实。',
    '- 工具调用、分条、潜水、唤醒和 QQ 消息发送规则由 qq-bridge 当前 DSH preset 负责。',
    '',
    '## 七、已确认记忆',
    JSON.stringify(persona.memory, null, 2),
    '',
  ].join('\n');
}

async function atomic(file, content) {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp-${process.pid}`;
  await writeFile(temp, content, 'utf8');
  await rename(temp, file);
}

export async function exportToQqBridge(root, id, bridgeRoot, { roleName = '蓝色大肥鱼', activate = false, mode = 'active' } = {}) {
  const persona = await loadPersona(root, id);
  const roleFile = path.join(bridgeRoot, 'roles', `${roleName}.md`);
  await atomic(roleFile, renderRole(persona));
  if (activate) {
    await atomic(path.join(bridgeRoot, 'state', 'current-role.json'), `${JSON.stringify({ role: roleName, mode }, null, 2)}\n`);
  }
  return { roleName, roleFile, version: persona.manifest.version, activated: activate };
}

export async function readQqBridgeRole(bridgeRoot, roleName = '蓝色大肥鱼') {
  return readFile(path.join(bridgeRoot, 'roles', `${roleName}.md`), 'utf8');
}
