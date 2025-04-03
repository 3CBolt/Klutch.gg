"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useSocket } from "@/app/hooks/useSocket";

type ChallengeStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "DISPUTED";

interface ChallengeActionsProps {
  challengeId: string;
  canEdit: boolean;
  canDelete: boolean;
  canJoin: boolean;
  status: ChallengeStatus;
}

export default function ChallengeActions({
  challengeId,
  canEdit,
  canDelete,
  canJoin,
  status,
}: ChallengeActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState<"delete" | "join" | null>(null);
  const { socket } = useSocket();

  const handleEdit = () => {
    router.push(`/challenges/${challengeId}/edit`);
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this challenge? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);
      setActionType("delete");

      const response = await fetch(`/api/challenge/${challengeId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete challenge");
      }

      // Emit challenge deletion event
      socket?.emit("challenge:delete", { challengeId });

      toast.success("Challenge deleted successfully");
      router.push("/challenges");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete challenge",
      );
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  const handleJoin = async () => {
    try {
      setIsLoading(true);
      setActionType("join");

      const response = await fetch(`/api/challenge/${challengeId}/join`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to join challenge");
      }

      // Emit challenge join event
      socket?.emit("challenge:join", {
        challengeId,
        opponent: data.opponent,
      });

      toast.success("Successfully joined challenge");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to join challenge",
      );
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {canEdit && (
        <button
          onClick={handleEdit}
          disabled={isLoading}
          className="inline-flex justify-center items-center min-h-[44px] px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Edit Challenge
        </button>
      )}

      {canDelete && (
        <button
          onClick={handleDelete}
          disabled={isLoading}
          className="inline-flex justify-center items-center min-h-[44px] px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading && actionType === "delete" ? (
            <>
              <span className="animate-spin mr-2">⌛</span>
              Deleting...
            </>
          ) : (
            "Delete Challenge"
          )}
        </button>
      )}

      {canJoin && (
        <button
          onClick={handleJoin}
          disabled={isLoading}
          className="inline-flex justify-center items-center min-h-[44px] px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading && actionType === "join" ? (
            <>
              <span className="animate-spin mr-2">⌛</span>
              Joining...
            </>
          ) : (
            "Join Challenge"
          )}
        </button>
      )}

      <button
        onClick={() => router.back()}
        disabled={isLoading}
        className="inline-flex justify-center items-center min-h-[44px] px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Back
      </button>
    </div>
  );
}
