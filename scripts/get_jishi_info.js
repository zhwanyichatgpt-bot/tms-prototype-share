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

    // 执行脚本获取选中的画板/图层详细信息
    const scriptCode = `
      (() => {
        const selection = jsDesign.currentPage.selection;
        const pageName = jsDesign.currentPage.name;
        if (!selection || selection.length === 0) {
          return {
            pageName,
            selectionCount: 0,
            message: "当前页面没有选中任何图层/画板",
            allTopNodes: jsDesign.currentPage.children.map(c => ({ id: c.id, name: c.name, type: c.type }))
          };
        }

        function extractNode(n, depth = 0) {
          if (depth > 4) return { id: n.id, name: n.name, type: n.type };
          const res = {
            id: n.id,
            name: n.name,
            type: n.type,
            width: n.width,
            height: n.height
          };
          if (n.characters !== undefined) {
            res.characters = n.characters;
          }
          if (n.children && n.children.length > 0) {
            res.children = n.children.map(c => extractNode(c, depth + 1));
          }
          return res;
        }

        return {
          pageName,
          selectionCount: selection.length,
          selection: selection.map(n => extractNode(n))
        };
      })()
    `;

    const res = await client.callTool({
      name: "execute_script",
      arguments: {
        code: scriptCode
      }
    });

    console.log("=== JISHI SELECTION DATA ===");
    if (res.content && res.content[0]) {
      console.log(res.content[0].text);
    } else {
      console.log(JSON.stringify(res, null, 2));
    }

  } catch (err) {
    console.error("❌ 执行失败:", err.message);
  } finally {
    process.exit(0);
  }
}

main();
