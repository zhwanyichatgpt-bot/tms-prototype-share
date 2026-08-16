import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { writeFileSync } from "fs";

async function main() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@jiujiang/jishi-mcp-server"]
  });
  const client = new Client({ name: "detail-fetcher-v2", version: "1.0.0" }, { capabilities: {} });

  try {
    await client.connect(transport);
    const clientsRes = await client.callTool({ name: "list_plugin_clients", arguments: {} });
    const parsed = JSON.parse(clientsRes.content[0].text);
    const clientId = parsed[0].clientId;

    // 1. 导出船东首页整帧为图片
    console.log("=== 导出船东首页画板为图片 ===");
    const imgRes = await client.callTool({
      name: "save_image",
      arguments: {
        nodeName: "船东首页",
        savePath: "/Users/zh2025/Desktop/TMS项目资料/TMS3.0原型验证/scripts/shipowner_home_full.png",
        clientId
      }
    });
    console.log("图片导出:", imgRes.content[0].text);

    // 2. 获取船东首页一级子节点
    console.log("\n=== 获取船东首页一级子节点 ===");
    const childrenRes = await client.callTool({
      name: "get_node_children",
      arguments: { name: "船东首页", clientId }
    });
    const childrenData = childrenRes.content[0].text;
    writeFileSync(
      "/Users/zh2025/Desktop/TMS项目资料/TMS3.0原型验证/scripts/shipowner_home_children.json",
      childrenData,
      "utf-8"
    );
    console.log("一级子节点数据已保存");

    // 解析一级子节点，对每个重要的 FRAME/GROUP 再获取二级子节点
    const children = JSON.parse(childrenData);
    const allData = { root: children, subNodes: {} };

    if (Array.isArray(children)) {
      for (const child of children) {
        if ((child.type === "FRAME" || child.type === "GROUP" || child.type === "INSTANCE" || child.type === "COMPONENT") && child.childCount > 0) {
          console.log(`  获取子节点: ${child.name} (${child.id})`);
          try {
            const subRes = await client.callTool({
              name: "get_node_children",
              arguments: { name: child.name, clientId }
            });
            allData.subNodes[child.name] = JSON.parse(subRes.content[0].text);
          } catch (e) {
            console.log(`  跳过: ${child.name} - ${e.message}`);
          }
        }
      }
    }

    writeFileSync(
      "/Users/zh2025/Desktop/TMS项目资料/TMS3.0原型验证/scripts/shipowner_home_tree.json",
      JSON.stringify(allData, null, 2),
      "utf-8"
    );
    console.log("\n完整节点树已保存至 shipowner_home_tree.json");

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    process.exit(0);
  }
}

main();
