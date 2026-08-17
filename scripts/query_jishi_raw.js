import { spawn } from 'child_process';

async function main() {
  const child = spawn('npx', ['-y', '@jiujiang/jishi-mcp-server'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  child.stderr.on('data', (data) => {
    // console.log('[Server Stderr]:', data.toString().trim());
  });

  let buffer = '';
  child.stdout.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep partial line

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line.trim());
        if (msg.id === 2) {
          console.log('\n================ 即时设计返回结果 ================\n');
          console.log(JSON.stringify(msg, null, 2));
          console.log('\n===================================================\n');
          child.kill();
          process.exit(0);
        }
      } catch (e) {
        // ignore non-json
      }
    }
  });

  function sendMsg(msg) {
    const json = JSON.stringify(msg);
    child.stdin.write(json + '\n');
  }

  // 1. 发送 initialize
  sendMsg({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'raw-client', version: '1.0.0' }
    }
  });

  // 2. 发送 initialized 通知 & 执行脚本查询
  setTimeout(() => {
    sendMsg({
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    });

    const script = `
      (() => {
        const page = jsDesign.currentPage;
        const selection = page.selection;
        
        function summarize(n, depth = 0) {
          if (depth > 3) return { id: n.id, name: n.name, type: n.type };
          const res = {
            id: n.id,
            name: n.name,
            type: n.type,
            width: n.width,
            height: n.height
          };
          if (n.characters !== undefined) res.characters = n.characters;
          if (n.children && n.children.length > 0) {
            res.children = n.children.map(c => summarize(c, depth + 1));
          }
          return res;
        }

        return {
          documentTitle: jsDesign.root ? jsDesign.root.name : "未知",
          currentPageName: page ? page.name : "未知",
          selectionCount: selection ? selection.length : 0,
          selection: selection ? selection.map(n => summarize(n)) : [],
          topNodesInPage: page ? page.children.map(c => ({ id: c.id, name: c.name, type: c.type, width: c.width, height: c.height })) : []
        };
      })()
    `;

    sendMsg({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'execute_script',
        arguments: {
          code: script
        }
      }
    });
  }, 1000);

  setTimeout(() => {
    console.error('超时退出');
    child.kill();
    process.exit(1);
  }, 10000);
}

main().catch(console.error);
