"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ClubTimeline } from "@/app/components/clubs/ClubTimeline";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, Loader2, Trash2, Users } from "lucide-react";

interface Member {
  id: string;
  email: string;
  name?: string | null;
  isOwner: boolean;
}

interface Club {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  owner: {
    email: string;
  };
  members: Member[];
}

interface TimelineEvent {
  id: string;
  type:
    | "MEMBER_JOINED"
    | "CHALLENGE_CREATED"
    | "CHALLENGE_COMPLETED"
    | "MEMBER_LEFT";
  userId: string;
  userEmail: string;
  userName?: string;
  timestamp: Date;
  metadata?: any;
}

interface ClubDetailsProps {
  club: Club;
  userEmail: string;
  timelineEvents: TimelineEvent[];
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="text-center py-12">
      <h3 className="mt-2 text-sm font-semibold text-red-600">
        Error loading club
      </h3>
      <p className="mt-1 text-sm text-gray-500">{error}</p>
      <div className="mt-6">
        <Link href="/clubs" className="text-indigo-600 hover:text-indigo-500">
          Back to Clubs
        </Link>
      </div>
    </div>
  );
}

function MemberList({ members }: { members: Member[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Members
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {members.length} member{members.length !== 1 ? "s" : ""} in this club
        </p>
      </CardHeader>
      <CardContent>
        <div className="flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                    >
                      Member
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-0">
                        <div className="font-medium text-gray-900">
                          {member.name || member.email}
                        </div>
                        {member.name && (
                          <div className="text-gray-500">{member.email}</div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            member.isOwner
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {member.isOwner ? "Owner" : "Member"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ClubDetails({
  club,
  userEmail,
  timelineEvents,
}: ClubDetailsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const isOwner = club.owner.email === userEmail;
  const isMember = club.members.some((member) => member.email === userEmail);

  const handleJoinClub = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/club/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clubId: club.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to join club");
      }

      toast.success("Successfully joined club");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to join club");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClub = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this club? This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/club/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clubId: club.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete club");
      }

      toast.success("Successfully deleted club");
      router.push("/clubs");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete club");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center">
              <Link href="/clubs" className="mr-4">
                <Button className="h-8 w-8 p-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                  {club.name}
                </h2>
                {club.description && (
                  <p className="mt-2 text-sm text-gray-500">
                    {club.description}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
            {!isMember && (
              <Button
                onClick={handleJoinClub}
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Join Club
                  </>
                )}
              </Button>
            )}
            {isOwner && (
              <Button
                onClick={handleDeleteClub}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Club
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <MemberList members={club.members} />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ClubTimeline clubId={club.id} initialEvents={timelineEvents} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
