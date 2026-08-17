import { spawn } from 'child_process';

async function main() {
  const child = spawn('jishi-mcp-server', [], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let buffer = '';
  child.stdout.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line.trim());
        if (msg.id === 2) {
          console.log('\n🎯 即时设计返回 RAW:');
          console.log(JSON.stringify(msg, null, 2));
          child.kill();
          process.exit(0);
        }
      } catch (e) {
      }
    }
  });

  function sendMsg(msg) {
    child.stdin.write(JSON.stringify(msg) + '\n');
  }

  sendMsg({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'inspect-selection', version: '1.0.0' }
    }
  });

  setTimeout(() => {
    sendMsg({ jsonrpc: '2.0', method: 'notifications/initialized' });
    sendMsg({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'execute_script',
        arguments: {
          code: 'JSON.stringify({ doc: jsDesign.root ? jsDesign.root.name : "root", page: jsDesign.currentPage ? jsDesign.currentPage.name : "page", selCount: jsDesign.currentPage.selection ? jsDesign.currentPage.selection.length : 0, sel: jsDesign.currentPage.selection ? jsDesign.currentPage.selection.map(n => ({ id: n.id, name: n.name, type: n.type, width: n.width, height: n.height })) : [] })'
        }
      }
    });
  }, 1000);

  setTimeout(() => {
    console.error('连接超时');
    child.kill();
    process.exit(1);
  }, 8000);
}

main().catch(console.error);
