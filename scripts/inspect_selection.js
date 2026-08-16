import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@jiujiang/jishi-mcp-server"]
  });

  const client = new Client(
    { name: "antigravity-jishi-inspector", version: "1.0.0" },
    { capabilities: {} }
  );

  try {
    await client.connect(transport);

    // 1. 列出在线的插件客户端
    console.log("=== 1. 检查已连接客户端 (list_plugin_clients) ===");
    let clientId = null;
    try {
      const clientsRes = await client.callTool({
        name: "list_plugin_clients",
        arguments: {}
      });
      console.log("Clients Response:", JSON.stringify(clientsRes, null, 2));
      
      // 尝试解析 clientId
      if (clientsRes?.content?.[0]?.text) {
        const parsed = JSON.parse(clientsRes.content[0].text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          clientId = parsed[0].id || parsed[0].clientId || parsed[0];
        } else if (parsed.clients && parsed.clients.length > 0) {
          clientId = parsed.clients[0].id || parsed.clients[0];
        }
      }
    } catch (e) {
      console.log("List clients error:", e.message);
    }

    const args = clientId ? { clientId } : {};
    console.log("Using args:", args);

    // 2. 获取当前页面节点/画板
    console.log("\n=== 2. 获取页面画板 (get_page_nodes) ===");
    try {
      const pageNodesRes = await client.callTool({
        name: "get_page_nodes",
        arguments: args
      });
      console.log("Page Nodes Result:", JSON.stringify(pageNodesRes, null, 2));
    } catch (e) {
      console.log("Get page nodes error:", e.message);
    }

    // 3. 获取选中内容
    console.log("\n=== 3. 获取选中元素 (get_selection) ===");
    try {
      const selectionRes = await client.callTool({
        name: "get_selection",
        arguments: args
      });
      console.log("Selection Result:", JSON.stringify(selectionRes, null, 2));
    } catch (e) {
      console.log("Get selection error:", e.message);
    }

  } catch (err) {
    console.error("Connect error:", err.message);
  } finally {
    process.exit(0);
  }
}

main();
