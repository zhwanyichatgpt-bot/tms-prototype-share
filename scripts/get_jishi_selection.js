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
    const result = await client.callTool({
      name: "get_selection",
      arguments: {}
    });
    console.log("=== SELECTION RESULT START ===");
    console.log(JSON.stringify(result, null, 2));
    console.log("=== SELECTION RESULT END ===");
  } catch (err) {
    console.error("❌ 调用 get_selection 失败:", err.message);
  } finally {
    process.exit(0);
  }
}

main();
