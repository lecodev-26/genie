export default function handler(req: any, res: any) {
  if (req.method !== "GET") { res.status(405).send("Method Not Allowed"); return; }
  const token = process.env.OPENAI_APPS_CHALLENGE_TOKEN;
  if (!token) { res.status(404).send("Not Found"); return; }
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.status(200).send(token);
}
