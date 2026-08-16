import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@jiujiang/jishi-mcp-server"]
  });

  const client = new Client({ name: "shipowner-fetcher", version: "1.0.0" }, { capabilities: {} });

  try {
    await client.connect(transport);
    console.log("=== 获取船东首页 (nodeId: 274:1) 节点细节 ===");
    
    // 获取 list_plugin_clients
    const clientsRes = await client.callTool({ name: "list_plugin_clients", arguments: {} });
    let clientId = null;
    if (clientsRes?.content?.[0]?.text) {
      const parsed = JSON.parse(clientsRes.content[0].text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        clientId = parsed[0].clientId || parsed[0].id;
      }
    }

    const args = { nodeId: "274:1", ...(clientId ? { clientId } : {}) };
    const res = await client.callTool({
      name: "get_node_children",
      arguments: args
    });
    console.log("NODE_DETAIL:", JSON.stringify(res, null, 2));

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    process.exit(0);
  }
}

main();
