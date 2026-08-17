import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@jiujiang/jishi-mcp-server"]
  });

  const client = new Client({ name: "doc-explorer", version: "1.0.0" }, { capabilities: {} });

  try {
    await client.connect(transport);
    const clientsRes = await client.callTool({ name: "list_plugin_clients", arguments: {} });
    const parsed = JSON.parse(clientsRes.content[0].text);
    const clientId = parsed[0]?.clientId;

    const res = await client.callTool({
      name: "get_page_nodes",
      arguments: { clientId }
    });

    console.log("=== ALL PAGES / BOARDS ===");
    console.log(res.content[0].text);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    process.exit(0);
  }
}

main();
