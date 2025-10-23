"use client";

import { SignUp } from "@clerk/nextjs";

export default function GoogleSignUpPage() {
  return (
    <SignUp
      path="/sign-up/google"
      routing="path"
      signInUrl="/sign-in"
      afterSignUpUrl="/onboarding"
      appearance={{
        elements: { rootBox: "flex justify-center items-center min-h-screen" },
      }}
    />
  );
}
