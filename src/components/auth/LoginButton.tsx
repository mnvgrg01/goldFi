"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/Button";

export function LoginButton() {
  const { login, logout, authenticated, ready, user } = usePrivy();

  if (!ready) {
    return (
      <Button disabled>
        Loading...
      </Button>
    );
  }

  if (authenticated && user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {user.email?.address || "Connected"}
        </span>
        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={login}>
      Get Started
    </Button>
  );
}
