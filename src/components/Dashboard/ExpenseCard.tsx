import React from 'react'
import { Calendar, DollarSign, User, Users } from 'lucide-react'

interface Expense {
  id: string
  description: string
  amount: number
  paid_by: string
  created_at: string
  paid_by_email?: string
  splits?: Array<{
    user_id: string
    amount: number
    email?: string
  }>
}

interface ExpenseSplit {
  expense_id: string
  from_user: string
  to_user: string
  amount: number
  settled: boolean
  settled_at?: string
  payment_method?: string
  created_at: string
}

interface ExpenseCardProps {
  expense: Expense
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900">{expense.description}</h4>
        <div className="flex items-center space-x-1">
          <DollarSign className="w-4 h-4 text-green-600" />
          <span className="font-bold text-green-600">${expense.amount.toFixed(2)}</span>
        </div>
      </div>
      
      {expense.splits && expense.splits.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center space-x-2 mb-1">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-600">Split between: </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {expense.splits.map((split, index) => (
  <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
    {split.from_profile?.email?.split('@')[0] || 'Unknown'}: ${split.amount.toFixed(2)}
  </span>
))}
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4" />
          <span>Paid by {expense.paid_by_email?.split('@')[0] || 'Unknown'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(expense.created_at)} at {formatTime(expense.created_at)}</span>
        </div>
      </div>
    </div>
  )
}