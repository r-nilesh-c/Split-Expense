import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, QrCode, X, Check } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

interface Member {
  id: string
  user_id: string
  email: string
  joined_at: string
  upi_qr_code_url?: string
}

interface BalanceCardProps {
  groupId: string
  members: Member[]
  onSettlementCreated?: () => void
}

interface Balance {
  userId: string
  email: string
  balance: number
  upi_qr_code_url?: string
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ groupId, members, onSettlementCreated }) => {
  const { user } = useAuth()
  const [balances, setBalances] = useState<Balance[]>([])
  const [loading, setLoading] = useState(true)
  const [showQrForUser, setShowQrForUser] = useState<string | null>(null)
  const [creatingSettlement, setCreatingSettlement] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    calculateBalances()
  }, [groupId, members])

  const calculateBalances = async () => {
    try {
      // Get all expenses for this group
      const { data: settlements, error: settlementsError } = await supabase
  .from('settlements')
  .select('*')
  .eq('group_id', groupId)
  .eq('status', 'paid')

if (settlementsError) throw settlementsError

      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('group_id', groupId)

      if (expensesError) throw expensesError

      // Get all expense splits for this group
      const { data: splits, error: splitsError } = await supabase
        .from('expense_splits')
        .select('*')
        .in('expense_id', expenses.map(e => e.id))

      if (splitsError) throw splitsError

      

      // Calculate balances for each member
      const memberBalances = members.map(member => {
        const memberExpenses = expenses.filter(e => e.paid_by === member.user_id)
        const totalPaid = memberExpenses.reduce((sum, expense) => sum + expense.amount, 0)
        
        const memberSplits = splits.filter(s => s.user_id === member.user_id)
        const totalOwed = memberSplits.reduce((sum, split) => sum + split.amount, 0)

        // Subtract paid settlements (member as debtor)
        const paidAsDebtor = settlements
          .filter(s => s.from_user === member.user_id)
          .reduce((sum, s) => sum + s.amount, 0)

        // Add paid settlements (member as creditor)
        const paidAsCreditor = settlements
          .filter(s => s.to_user === member.user_id)
          .reduce((sum, s) => sum + s.amount, 0)

        return {
          userId: member.user_id,
          email: member.email,
          balance: totalPaid - totalOwed + paidAsDebtor - paidAsCreditor,
          upi_qr_code_url: member.upi_qr_code_url
        }
      })

      setBalances(memberBalances)
    } catch (error) {
      console.error('Error calculating balances:', error)
    } finally {
      setLoading(false)
    }
  }

  const createSettlement = async (creditorUserId: string, amount: number) => {
    if (!user) return

    setCreatingSettlement(creditorUserId)
    setError('')

    try {
      const { error: settlementError } = await supabase
        .from('settlements')
        .insert({
          group_id: groupId,
          from_user: user.id,
          to_user: creditorUserId,
          amount: Math.abs(amount),
          status: 'pending'
        })

      if (settlementError) throw settlementError

      // Refresh balances and notify parent component
      await calculateBalances()
      onSettlementCreated?.()
    } catch (err: any) {
      setError(err.message || 'Failed to create settlement')
    } finally {
      setCreatingSettlement(null)
    }
  }
  const userBalance = balances.find(b => b.userId === user?.id)?.balance || 0
  type Settlement = {
    id: string;
    group_id: string;
    from_user: string;
    to_user: string;
    amount: number;
    settled_at?: string;
    status: string;
    payment_method?: string;
  };
  
  const deleteExpenseSplitsIfSettled = async (groupId: string, fromUser: string, toUser: string) => {
    // Fetch all expenses paid by the creditor (to_user) in this group
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('id')
      .eq('group_id', groupId)
      .eq('paid_by', toUser);
  
    if (expensesError) throw expensesError;
  
    const expenseIds = expenses.map(e => e.id);
  
    // Fetch all splits owed by the debtor (from_user) to the creditor (to_user)
    const { data: splits, error: splitsError } = await supabase
      .from('expense_splits')
      .select('id')
      .in('expense_id', expenseIds)
      .eq('user_id', fromUser);
  
    if (splitsError) throw splitsError;
  
    const splitIdsToDelete = splits.map(s => s.id);
  
    if (splitIdsToDelete.length > 0) {
      const { error: deleteSplitsError } = await supabase
        .from('expense_splits')
        .delete()
        .in('id', splitIdsToDelete);
  
      if (deleteSplitsError) throw deleteSplitsError;
    }
  };

  return (
    
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Balances</h3>
      
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Your balance */}
          <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">Your balance</span>
              </div>
              <div className="flex items-center space-x-1">
                {userBalance > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : userBalance < 0 ? (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                ) : null}
                <span className={`font-bold ${
                  userBalance > 0 ? 'text-green-600' : 
                  userBalance < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {userBalance > 0 ? '+' : ''}${userBalance.toFixed(2)}
                </span>
              </div>
            </div>
            {userBalance > 0 && (
              <p className="text-xs text-green-700 mt-1">You are owed this amount</p>
            )}
            {userBalance < 0 && (
              <p className="text-xs text-red-700 mt-1">You owe this amount</p>
            )}
          </div>

          {/* Other members' balances */}
          {balances
  .filter(b => b.userId !== user?.id)
  .map((balance) => {
    const isDebtor = balance.balance > 0 && userBalance < 0

    return (
      <div key={balance.userId}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">{balance.email.split('@')[0]}</span>
          <div className="flex items-center space-x-2">
            <span
              className={`text-sm font-medium ${
                balance.balance > 0
                  ? 'text-green-600'
                  : balance.balance < 0
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}
            >
              {balance.balance > 0 ? '+' : ''}
              ${balance.balance.toFixed(2)}
            </span>

            {/* Show buttons if user owes this person money */}
            {isDebtor && (
              <div className="flex items-center space-x-1">
                {/* QR Code button */}
                {balance.upi_qr_code_url && (
                  <button
                    onClick={() =>
                      setShowQrForUser(showQrForUser === balance.userId ? null : balance.userId)
                    }
                    className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                    title={showQrForUser === balance.userId ? 'Hide QR Code' : 'Show QR Code'}
                  >
                    {showQrForUser === balance.userId ? (
                      <X className="w-4 h-4" />
                    ) : (
                      <QrCode className="w-4 h-4" />
                    )}
                  </button>
                )}

                {/* Mark as Paid button */}
                <button
                  onClick={() => createSettlement(balance.userId, balance.balance)}
                  disabled={creatingSettlement === balance.userId}
                  className="p-1 text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
                  title="Mark as paid"
                >
                  {creatingSettlement === balance.userId ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* QR Code Display */}
        {showQrForUser === balance.userId && balance.upi_qr_code_url && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-xs font-medium text-gray-700 mb-2">
                Scan to pay {balance.email.split('@')[0]}
              </p>
              <div className="inline-block p-2 bg-white rounded-lg shadow-sm">
                <img
                  src={balance.upi_qr_code_url}
                  alt={`UPI QR Code for ${balance.email.split('@')[0]}`}
                  className="w-32 h-32 object-cover rounded"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Amount owed: ${balance.balance.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>
    )
  })}

          
          {error && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}