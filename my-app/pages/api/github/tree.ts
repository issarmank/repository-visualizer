import type { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const { owner, repo } = req.query

  if (!session?.accessToken) return res.status(401).json({ error: "Unauthorized" })

  // Fetch the recursive tree to get all files/folders in one go
  const ghRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`, 
    {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/vnd.github+json",
      },
    }
  )

  if (!ghRes.ok) return res.status(ghRes.status).json({ error: "Failed to fetch tree" })
  
  const data = await ghRes.json()
  return res.status(200).json(data)
}