import type { NextApiRequest, NextApiResponse } from "next"

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res.status(405).json({ error: "Method Not Allowed" })
  }
  // Stubbed: accept any payload and return 200
  return res.status(200).json({ received: true })
}



