import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@jiujiang/jishi-mcp-server"]
  });

  const client = new Client({ name: "selection-exporter", version: "1.0.0" }, { capabilities: {} });

  try {
    await client.connect(transport);
    console.log("=== 正在连接即时设计并导出当前选中的画板 ===");

    const clientsRes = await client.callTool({ name: "list_plugin_clients", arguments: {} });
    const parsed = JSON.parse(clientsRes.content[0].text);
    const clientId = parsed[0]?.clientId;
    console.log("Connected doc:", parsed[0]?.info?.docName);

    const savePath = "/Users/zh2025/Desktop/TMS项目资料/TMS3.0原型验证/scripts/current_selection.png";
    const res = await client.callTool({
      name: "save_image",
      arguments: {
        savePath: savePath,
        clientId: clientId,
        format: "PNG",
        scale: 2
      }
    });

    console.log("Export Result:", JSON.stringify(res, null, 2));
    console.log("✅ 成功导出当前选中的页面到: scripts/current_selection.png");

  } catch (err) {
    console.error("Export error:", err.message);
  } finally {
    process.exit(0);
  }
}

main();
