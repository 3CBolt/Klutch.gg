"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/app/lib/utils";
import ChallengeActions from "./ChallengeActions";
import { MarkWinnerSection } from "./MarkWinnerSection";
import ChallengeUpdates from "./ChallengeUpdates";

type ChallengeStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "DISPUTED";

interface ChallengePageClientProps {
  challenge: any;
  isCreator: boolean;
  isOpponent: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canJoin: boolean;
  isParticipant: boolean;
}

export default function ChallengePageClient({
  challenge,
  isCreator,
  isOpponent,
  canEdit,
  canDelete,
  canJoin,
  isParticipant,
}: ChallengePageClientProps) {
  const [currentChallenge, setCurrentChallenge] = useState(challenge);

  const handleStatusUpdate = (status: ChallengeStatus) => {
    setCurrentChallenge((prev: any) => ({ ...prev, status }));
  };

  const handleOpponentJoin = (opponent: any) => {
    setCurrentChallenge((prev: any) => ({ ...prev, opponent }));
  };

  const handleWinnerUpdate = (winner: any) => {
    setCurrentChallenge((prev: any) => ({ ...prev, winner }));
  };

  const handleDisputeUpdate = (disputeReason: string | null) => {
    setCurrentChallenge((prev: any) => ({ ...prev, disputeReason }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <div className="sm:flex sm:items-center sm:justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Challenge Details
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  View and manage your challenge
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <ChallengeActions
                  challengeId={currentChallenge.id}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  canJoin={canJoin}
                  status={currentChallenge.status}
                />
              </div>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-8">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Creator</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <Link
                      href={`/profile/${currentChallenge.creator.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {currentChallenge.creator.displayName ||
                        currentChallenge.creator.name ||
                        currentChallenge.creator.email}
                    </Link>
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">
                    Opponent
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {currentChallenge.opponent ? (
                      <Link
                        href={`/profile/${currentChallenge.opponent.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {currentChallenge.opponent.displayName ||
                          currentChallenge.opponent.name ||
                          currentChallenge.opponent.email}
                      </Link>
                    ) : (
                      <span className="text-gray-500 italic">
                        Not joined yet
                      </span>
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {currentChallenge.type}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Stake</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatCurrency(currentChallenge.stake)}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        currentChallenge.status === "OPEN"
                          ? "bg-green-100 text-green-800"
                          : currentChallenge.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-800"
                            : currentChallenge.status === "COMPLETED"
                              ? "bg-purple-100 text-purple-800"
                              : currentChallenge.status === "DISPUTED"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {currentChallenge.status}
                    </span>
                  </dd>
                </div>
                {currentChallenge.winner && (
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      Winner
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <Link
                        href={`/profile/${currentChallenge.winner.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {currentChallenge.winner.displayName ||
                          currentChallenge.winner.name ||
                          currentChallenge.winner.email}
                      </Link>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>

        {currentChallenge.status === "IN_PROGRESS" && isParticipant && (
          <MarkWinnerSection
            challenge={currentChallenge}
            isParticipant={isParticipant}
          />
        )}

        {currentChallenge.status === "COMPLETED" && currentChallenge.winner && (
          <div className="bg-green-50 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-green-800">
              Challenge Complete
            </h2>
            <p className="mt-2 text-green-700">
              Winner:{" "}
              {currentChallenge.winner.displayName ||
                currentChallenge.winner.name}
            </p>
          </div>
        )}

        {currentChallenge.status === "DISPUTED" && (
          <div className="bg-red-50 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-red-800">
              Challenge Disputed
            </h2>
            <p className="mt-2 text-red-700">
              This challenge is currently under dispute. Both players have
              submitted different winners.
              {currentChallenge.disputeReason && (
                <>
                  <br />
                  <span className="font-medium">Dispute reason:</span>{" "}
                  {currentChallenge.disputeReason}
                </>
              )}
            </p>
          </div>
        )}

        <ChallengeUpdates
          challengeId={currentChallenge.id}
          onStatusUpdate={handleStatusUpdate}
          onOpponentJoin={handleOpponentJoin}
          onWinnerUpdate={handleWinnerUpdate}
          onDisputeUpdate={handleDisputeUpdate}
        />
      </div>
    </div>
  );
}
