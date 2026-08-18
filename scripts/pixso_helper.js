// 使用原生 fetch

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
    const text = await res.text();
    // send notifications/initialized
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
    // parse SSE or json
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
  console.log("Connecting to Pixso MCP...");
  await client.init();
  console.log("Session ID:", client.sessionId);

  console.log("\n=== 1. 获取所有页面与画板 ===");
  const framesRes = await client.callTool('get_top_level_frames', { type: 'frame' });
  console.log(JSON.stringify(framesRes, null, 2));
}

main().catch(console.error);
