import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { writeFileSync } from "fs";

async function main() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@jiujiang/jishi-mcp-server"]
  });

  const client = new Client({ name: "cargo-detail-fetcher", version: "1.0.0" }, { capabilities: {} });

  try {
    await client.connect(transport);
    const clientsRes = await client.callTool({ name: "list_plugin_clients", arguments: {} });
    const parsed = JSON.parse(clientsRes.content[0].text);
    const clientId = parsed[0].clientId;

    console.log("=== 尝试获取选中画板 / '货源详情' 节点数据 ===");

    // 1. 获取选中节点
    try {
      const selRes = await client.callTool({
        name: "get_selection",
        arguments: { clientId }
      });
      console.log("=== SELECTION ===");
      console.log(selRes.content[0].text);
      writeFileSync("/Users/zh2025/Desktop/TMS项目资料/TMS3.0原型验证/scripts/cargo_detail_selection.json", selRes.content[0].text, "utf-8");
    } catch (e) {
      console.log("get_selection err:", e.message);
    }

    // 2. 导出 '货源详情' 画板为参考图片
    try {
      const imgRes = await client.callTool({
        name: "save_image",
        arguments: {
          nodeName: "货源详情",
          savePath: "/Users/zh2025/Desktop/TMS项目资料/TMS3.0原型验证/public/cargo_detail_board.png",
          clientId
        }
      });
      console.log("=== IMAGE SAVE ===", imgRes.content[0].text);
    } catch (e) {
      console.log("save_image err:", e.message);
    }

    // 3. 获取 '货源详情' 画板下的子节点
    try {
      const childrenRes = await client.callTool({
        name: "get_node_children",
        arguments: { name: "货源详情", clientId }
      });
      console.log("=== CHILDREN DATA SAVED ===");
      writeFileSync("/Users/zh2025/Desktop/TMS项目资料/TMS3.0原型验证/scripts/cargo_detail_children.json", childrenRes.content[0].text, "utf-8");
    } catch (e) {
      console.log("get_node_children err:", e.message);
    }

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    process.exit(0);
  }
}

main();
