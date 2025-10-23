"use client";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState(""); // ✅ new
  const [role, setRole] = useState("BUYER");
  const [loading, setLoading] = useState(false);

  if (!isLoaded) return <p className="text-center mt-10">Loading...</p>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user?.id,
          email: user?.primaryEmailAddress?.emailAddress,
          firstName,
          lastName,
          phone, // ✅ send phone
          role,
        }),
      });

      if (res.ok) {
        toast.success("Profile setup complete 🎉");
        router.push("/");
      } else {
        toast.error("Failed to save onboarding info.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <Card className="w-full max-w-md shadow-lg border border-gray-200 rounded-2xl bg-white">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold text-gray-900">
            Welcome to SpareLink
          </CardTitle>
          <CardDescription className="text-gray-500">
            Complete your profile to continue
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* First Name */}
            <div className="space-y-2">
              <Label className="text-gray-700">First Name</Label>
              <Input
                placeholder="Enter your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="border-gray-300 focus-visible:ring-black"
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label className="text-gray-700">Last Name</Label>
              <Input
                placeholder="Enter your last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="border-gray-300 focus-visible:ring-black"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label className="text-gray-700">Phone Number</Label>
              <Input
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="border-gray-300 focus-visible:ring-black"
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label className="text-gray-700">Account Type</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="border-gray-300 focus-visible:ring-black">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUYER">Buyer</SelectItem>
                  <SelectItem value="SELLER">Seller</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full bg-black hover:bg-gray-800 text-white py-2 rounded-md transition-all duration-150"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin h-4 w-4" />
                  Saving...
                </div>
              ) : (
                "Finish Onboarding"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
