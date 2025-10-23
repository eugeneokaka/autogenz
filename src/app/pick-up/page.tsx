"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface PickupLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  contact?: string;
}

export default function PickupLocationPage() {
  const { user } = useUser();
  const [locations, setLocations] = useState<PickupLocation[]>([]);
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    contact: "",
  });
  const [loading, setLoading] = useState(false);

  const fetchLocations = async () => {
    const res = await fetch("/api/pickup-locations");
    const data = await res.json();
    setLocations(data);
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please sign in as an admin.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/pickup-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userClerkId: user.id, ...form }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create location");
        return;
      }

      toast.success("Pickup location added successfully!");
      setForm({ name: "", address: "", city: "", contact: "" });
      fetchLocations();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <Card className="border border-gray-200 shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Create Pickup Location
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Location Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              placeholder="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
            />
            <Input
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              required
            />
            <Input
              placeholder="Contact (optional)"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
            />
            <Button
              type="submit"
              disabled={loading}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {loading ? "Saving..." : "Create Location"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Location List */}
      <div className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold mb-3">
          Existing Pickup Locations
        </h2>
        {locations.length === 0 ? (
          <p className="text-muted-foreground">No locations added yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {locations.map((loc) => (
              <Card key={loc.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg">{loc.name}</h3>
                  <p className="text-sm text-muted-foreground">{loc.address}</p>
                  <p className="text-sm text-muted-foreground">{loc.city}</p>
                  {loc.contact && (
                    <p className="text-sm text-muted-foreground">
                      Contact: {loc.contact}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
