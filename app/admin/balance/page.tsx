import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/app/lib/prisma";
import BalanceManagementForm from "./BalanceManagementForm";

export default async function AdminBalancePage() {
  const session = await getServerSession(authOptions);

  // Check if user is admin
  if (!session?.user?.isAdmin) {
    redirect("/");
  }

  // Fetch all users for the dropdown
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      displayName: true,
      balance: true,
    },
    orderBy: {
      email: "asc",
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Balance Management
            </h1>
            <p className="text-sm text-gray-500 mb-8">
              Use this page to manually adjust user balances for moderation
              purposes.
            </p>
            <BalanceManagementForm users={users} />
          </div>
        </div>
      </div>
    </div>
  );
}
