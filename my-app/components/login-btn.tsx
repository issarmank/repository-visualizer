"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

export default function LoginButton() {
  const { data: session } = useSession();

  return (
    <div className="auth-container h-screen text-black">
      <nav className="mx-auto mt-4 w-fit flex justify-between items-center p-4">
        <div className="flex items-center justify-center gap-10">
          {session && (
            <>
              <Link href="/repos" className="font-comic hover:text-blue-600 font-bold">
                Your Repositories
              </Link>
              <Link href="/visualize" className="font-comic hover:text-blue-600 font-bold">
                Visualize
              </Link>
            </>
          )}
        </div>
      </nav>

      <h1 className="text-center text-2xl transform translate-y-24 font-comic font-bold">
        Welcome to the 3D Repository Visualizer
      </h1>

      {session ? (
        <div className="signed-in text-center transform translate-y-36">
          <p>
            Signed in as <strong>{session.user?.email ?? session.user?.name ?? "GitHub user"}</strong>
          </p>
          <button className="sign-out-btn font-comic mt-4" onClick={() => signOut({ callbackUrl: "/" })}>
            Sign out
          </button>
        </div>
      ) : (
        <div className="not-signed-in text-center transform translate-y-52">
          <button className="sign-in-btn font-comic" onClick={() => signIn("github", { callbackUrl: "/repos" })}>
            Sign in with GitHub
          </button>
          <h1 className="font-comic text-center text-lg mt-5">Created By Issar Manknojiya</h1>
        </div>
      )}
    </div>
  );
}