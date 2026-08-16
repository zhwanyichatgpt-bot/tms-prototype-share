import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  console.log("🚀 正在连接九匠即时设计 MCP Server (127.0.0.1:19999)...");

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
    console.log("✅ 成功建立 MCP 协议连接！");

    // 获取所有可用工具
    const { tools } = await client.listTools();
    console.log(`\n📋 成功获取到 ${tools.length} 个即时设计工具方法:`);
    tools.forEach((t, i) => {
      console.log(`  ${i + 1}. [${t.name}]: ${t.description || '无描述'}`);
    });

    console.log("\n-------------------------------------------");
    console.log("MCP 通信正常，随时可以调用这些工具拉取设计数据！");

  } catch (err) {
    console.error("❌ 连接或通讯失败:", err.message);
  } finally {
    process.exit(0);
  }
}

main();
