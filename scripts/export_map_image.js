import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@jiujiang/jishi-mcp-server"]
  });

  const client = new Client({ name: "map-exporter", version: "1.0.0" }, { capabilities: {} });

  try {
    await client.connect(transport);
    console.log("=== 正在导出即时设计中的地图节点图片 ===");

    const clientsRes = await client.callTool({ name: "list_plugin_clients", arguments: {} });
    const parsed = JSON.parse(clientsRes.content[0].text);
    const clientId = parsed[0].clientId;

    // 尝试导出 船东首页 节点或特定地图图层
    const savePath = "/Users/zh2025/Desktop/TMS项目资料/TMS3.0原型验证/public/shipowner_map_bg.png";
    const res = await client.callTool({
      name: "save_image",
      arguments: {
        nodeName: "船东首页",
        savePath: savePath,
        clientId: clientId
      }
    });

    console.log("Export Result:", JSON.stringify(res, null, 2));

  } catch (err) {
    console.error("Export error:", err.message);
  } finally {
    process.exit(0);
  }
}

main();
