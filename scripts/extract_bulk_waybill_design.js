import fs from 'fs';
import path from 'path';

class PixsoMcpClient {
  constructor(baseUrl = 'http://127.0.0.1:3667/mcp') {
    this.baseUrl = baseUrl;
    this.sessionId = null;
    this.reqId = 1;
  }

  async init() {
    const initReq = {
      jsonrpc: '2.0',
      id: this.reqId++,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'antigravity-pixso-client', version: '1.0.0' }
      }
    };
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      },
      body: JSON.stringify(initReq)
    });
    this.sessionId = res.headers.get('mcp-session-id');
    await res.text();
    await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'mcp-session-id': this.sessionId
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'notifications/initialized'
      })
    });
    return this.sessionId;
  }

  async callTool(name, args = {}) {
    if (!this.sessionId) await this.init();
    const req = {
      jsonrpc: '2.0',
      id: this.reqId++,
      method: 'tools/call',
      params: {
        name,
        arguments: args
      }
    };
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'mcp-session-id': this.sessionId
      },
      body: JSON.stringify(req)
    });
    const text = await res.text();
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const json = JSON.parse(line.slice(6));
        return json.result;
      }
    }
    try {
      return JSON.parse(text).result;
    } catch {
      return text;
    }
  }
}

async function main() {
  const client = new PixsoMcpClient();
  await client.init();

  const targetFrameId = "22:107"; // 新增公开托运单-散杂货运输
  console.log(`\n=== 提取画板 ${targetFrameId} (新增公开托运单-散杂货运输) 的设计与代码 ===`);

  // 1. 获取 design_to_code
  console.log("1. 调用 design_to_code...");
  try {
    const codeRes = await client.callTool('design_to_code', {
      guids: [targetFrameId],
      clientFrameworks: 'vue'
    });
    fs.writeFileSync('scripts/pixso_code_22_107.json', JSON.stringify(codeRes, null, 2));
    console.log("Code saved to scripts/pixso_code_22_107.json");
  } catch (e) {
    console.error("design_to_code error:", e.message);
  }

  // 2. 获取 DSL
  console.log("2. 调用 get_node_dsl...");
  try {
    const dslRes = await client.callTool('get_node_dsl', {
      nodeId: targetFrameId
    });
    fs.writeFileSync('scripts/pixso_dsl_22_107.json', JSON.stringify(dslRes, null, 2));
    console.log("DSL saved to scripts/pixso_dsl_22_107.json");
  } catch (e) {
    console.error("get_node_dsl error:", e.message);
  }

  // 3. 获取截图
  console.log("3. 调用 get_screenshot...");
  try {
    const screenshotRes = await client.callTool('get_screenshot', {
      nodeIds: [targetFrameId]
    });
    fs.writeFileSync('scripts/pixso_screenshot_22_107.json', JSON.stringify(screenshotRes, null, 2));
    console.log("Screenshot info saved to scripts/pixso_screenshot_22_107.json");
  } catch (e) {
    console.error("get_screenshot error:", e.message);
  }
}

main().catch(console.error);
