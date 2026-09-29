export default {
  async fetch(request: Request): Promise<Response> {
    return Response.json({
      name: "Genie",
      status: "ok",
      service: "genie-mcp",
      endpoint: "/mcp",
    });
  },
};
