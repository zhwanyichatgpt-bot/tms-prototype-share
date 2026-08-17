import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@jiujiang/jishi-mcp-server"]
  });

  const client = new Client(
    { name: "antigravity-jishi-client", version: "1.0.0" },
    { capabilities: {} }
  );

  try {
    await client.connect(transport);
    console.log("Connected to MCP Server");
    
    // 先检查客户端列表
    const listRes = await client.callTool({
      name: "list_plugin_clients",
      arguments: {}
    });
    console.log("=== PLUGIN CLIENTS ===");
    console.log(JSON.stringify(listRes, null, 2));

    // 再获取选中的节点
    const selRes = await client.callTool({
      name: "get_selection",
      arguments: {}
    });
    console.log("=== GET SELECTION ===");
    console.log(JSON.stringify(selRes, null, 2));

  } catch (err) {
    console.error("❌ 调用失败:", err);
  } finally {
    process.exit(0);
  }
}

main();
