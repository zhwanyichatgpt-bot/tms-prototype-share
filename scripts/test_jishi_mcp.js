import { spawn } from 'child_process';

async function main() {
  console.log('正在启动即时设计 MCP Server 并通信...');
  const child = spawn('npx', ['-y', '@jiujiang/jishi-mcp-server'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  child.stderr.on('data', (data) => {
    console.log('[Server Stderr]:', data.toString().trim());
  });

  child.stdout.on('data', (chunk) => {
    console.log('[Server Stdout Raw]:', chunk.toString().trim());
  });

  function sendMsg(msg) {
    const json = JSON.stringify(msg);
    console.log('[Sending]:', json);
    child.stdin.write(json + '\n');
  }

  // 1. 发送 initialize 请求
  setTimeout(() => {
    sendMsg({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'antigravity-mcp-client', version: '1.0.0' }
      }
    });
  }, 1000);

  // 2. 发送 tools/list 请求
  setTimeout(() => {
    sendMsg({
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    });

    sendMsg({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    });
  }, 3000);

  // 8秒后关闭连接
  setTimeout(() => {
    console.log('测试完成，关闭连接。');
    child.kill();
    process.exit(0);
  }, 8000);
}

main().catch(console.error);

