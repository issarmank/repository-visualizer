'use client';

import { useSession, signIn, signOut } from "next-auth/react"

export default function LoginButton() {
  const { data: session } = useSession()

  if (session?.user) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p>Signed in as {session.user.email}</p>
        <button 
          onClick={() => signOut()}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p>Not signed in</p>
      <button 
        onClick={() => signIn("github")}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Sign in with GitHub
      </button>
    </div>
  )
}