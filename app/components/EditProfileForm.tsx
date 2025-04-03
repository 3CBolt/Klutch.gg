"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Loader2 } from "lucide-react";
import { showToast } from "@/app/lib/toast";

interface Profile {
  id: string;
  displayName: string | null;
  bio: string | null;
  kills: number;
  deaths: number;
  wins: number;
  gamesPlayed: number;
}

interface EditProfileFormProps {
  profile: Profile;
}

export default function EditProfileForm({ profile }: EditProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      displayName: formData.get("displayName"),
      bio: formData.get("bio"),
      kills: Number(formData.get("kills")),
      deaths: Number(formData.get("deaths")),
      wins: Number(formData.get("wins")),
      gamesPlayed: Number(formData.get("gamesPlayed")),
    };

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      showToast.success("Profile updated successfully");
      router.refresh();
    } catch (error) {
      showToast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            name="displayName"
            defaultValue={profile.displayName || ""}
            required
          />
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            rows={3}
            defaultValue={profile.bio || ""}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="kills">Kills</Label>
            <Input
              id="kills"
              name="kills"
              type="number"
              defaultValue={profile.kills}
              required
            />
          </div>

          <div>
            <Label htmlFor="deaths">Deaths</Label>
            <Input
              id="deaths"
              name="deaths"
              type="number"
              defaultValue={profile.deaths}
              required
            />
          </div>

          <div>
            <Label htmlFor="wins">Wins</Label>
            <Input
              id="wins"
              name="wins"
              type="number"
              defaultValue={profile.wins}
              required
            />
          </div>

          <div>
            <Label htmlFor="gamesPlayed">Games Played</Label>
            <Input
              id="gamesPlayed"
              name="gamesPlayed"
              type="number"
              defaultValue={profile.gamesPlayed}
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href={`/profile/${profile.id}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Profile"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
