import { TransactionType } from '@prisma/client';
import { format } from 'date-fns';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Trophy } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  createdAt: Date;
  description?: string | null;
  referenceId?: string | null;
  metadata?: any;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <p className="text-sm text-gray-500">No transactions yet</p>
      <p className="text-sm text-gray-500 mt-1">Your transaction history will appear here</p>
    </div>
  );
}

export default function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const getTransactionTypeLabel = (type: TransactionType) => {
    switch (type) {
      case 'DEPOSIT':
        return 'Deposit';
      case 'CHALLENGE_ENTRY':
        return 'Entry Fee';
      case 'CHALLENGE_WINNINGS':
        return 'Winnings';
      case 'CHALLENGE_REFUND':
        return 'Refund';
      default:
        return type;
    }
  };

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowDownCircle className="h-5 w-5 text-green-500" />;
      case 'CHALLENGE_ENTRY':
        return <ArrowUpCircle className="h-5 w-5 text-red-500" />;
      case 'CHALLENGE_WINNINGS':
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'CHALLENGE_REFUND':
        return <RefreshCw className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getAmountColor = (type: TransactionType) => {
    switch (type) {
      case 'DEPOSIT':
      case 'CHALLENGE_WINNINGS':
        return 'text-green-600';
      case 'CHALLENGE_ENTRY':
        return 'text-red-600';
      case 'CHALLENGE_REFUND':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  if (transactions.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {getTransactionIcon(transaction.type)}
                  <span className="ml-2 text-sm text-gray-900">
                    {getTransactionTypeLabel(transaction.type)}
                  </span>
                </div>
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getAmountColor(transaction.type)}`}>
                {transaction.type === 'CHALLENGE_ENTRY' ? '-' : '+'}
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(transaction.amount)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {transaction.description || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {format(new Date(transaction.createdAt), 'MMM d, yyyy h:mm a')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 