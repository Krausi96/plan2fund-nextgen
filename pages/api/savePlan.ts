import type { NextApiRequest, NextApiResponse } from "next"

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  const { programId, content } = req.body || {}
  // Stub: In real app, persist to DB (Supabase). Here we just echo back.
  return res.status(200).json({ ok: true, programId: programId || "generic", size: (content || "").length })
}



