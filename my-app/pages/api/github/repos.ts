import type { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

type Repo = {
  id: number
  name: string
  full_name: string
  private: boolean
  html_url: string
  updated_at: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.accessToken) {
    return res.status(401).json({ error: "Not authenticated" })
  }

  const ghRes = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  })

  if (!ghRes.ok) {
    const text = await ghRes.text()
    return res.status(ghRes.status).json({ error: text })
  }

  const data = (await ghRes.json()) as Repo[]
  return res.status(200).json(data)
}