import type { NextApiRequest, NextApiResponse } from "next"

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  const { brief } = req.body || {}
  const skeleton = [
    { id: "executive-summary", title: "Executive Summary" },
    { id: "products-services", title: "Products & Services" },
    { id: "market", title: "Market & Competition" },
    { id: "go-to-market", title: "Marketing & Sales" },
    { id: "finance", title: "Financial Planning" },
  ]
  return res.status(200).json({ brief: brief || "", chapters: skeleton })
}



