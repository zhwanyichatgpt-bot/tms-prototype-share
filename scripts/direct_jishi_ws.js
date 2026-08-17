// Node 24 原生支持 WebSocket
const ws = new WebSocket('ws://127.0.0.1:19999');

ws.addEventListener('open', () => {
  console.log('Connected to ws://127.0.0.1:19999');
  
  const req = {
    type: 'execute_script',
    id: 'req_1',
    script: `
      (() => {
        const selection = jsDesign.currentPage.selection;
        if (!selection || selection.length === 0) {
          return { error: 'No selection', currentPageName: jsDesign.currentPage.name };
        }
        return selection.map(node => ({
          id: node.id,
          name: node.name,
          type: node.type,
          width: node.width,
          height: node.height,
          x: node.x,
          y: node.y,
          pageName: jsDesign.currentPage.name
        }));
      })()
    `
  };
  
  ws.send(JSON.stringify(req));
  console.log('Sent execute_script request...');
});

ws.addEventListener('message', (event) => {
  console.log('Received response from JiShi:');
  console.log(event.data);
  process.exit(0);
});

ws.addEventListener('error', (err) => {
  console.error('WS Error:', err);
  process.exit(1);
});

setTimeout(() => {
  console.log('Timeout waiting for response');
  process.exit(1);
}, 5000);
