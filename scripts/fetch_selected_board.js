import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@jiujiang/jishi-mcp-server"]
  });

  const client = new Client({ name: "selected-board-fetcher", version: "1.0.0" }, { capabilities: {} });

  try {
    await client.connect(transport);
    console.log("=== 获取即时设计当前选中画板信息 ===");
    
    const clientsRes = await client.callTool({ name: "list_plugin_clients", arguments: {} });
    let clientId = null;
    if (clientsRes?.content?.[0]?.text) {
      const parsed = JSON.parse(clientsRes.content[0].text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        clientId = parsed[0].clientId || parsed[0].id;
      }
    }

    const args = clientId ? { clientId } : {};
    
    // 1. 获取当前选中的节点 (get_selection)
    try {
      const selRes = await client.callTool({ name: "get_selection", arguments: args });
      console.log("=== CURRENT SELECTION ===");
      console.log(selRes?.content?.[0]?.text || JSON.stringify(selRes, null, 2));
    } catch (e) {
      console.log("get_selection error:", e.message);
    }

    // 2. 获取页面节点树 (get_document)
    try {
      const docRes = await client.callTool({ name: "get_document", arguments: args });
      console.log("=== DOCUMENT TREE ===");
      console.log((docRes?.content?.[0]?.text || "").slice(0, 3000));
    } catch (e) {
      console.log("get_document error:", e.message);
    }

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    process.exit(0);
  }
}

main();
