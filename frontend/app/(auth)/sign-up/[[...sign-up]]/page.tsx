import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-gray-50">
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
    </div>
  );
}