import React, { useState } from 'react'
import { X, Receipt, DollarSign, Users, Calculator, Percent } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

interface Member {
  id: string
  user_id: string
  email: string
  joined_at: string
}

interface AddExpenseModalProps {
  groupId: string
  members: Member[]
  onClose: () => void
  onExpenseAdded: () => void
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  groupId,
  members,
  onClose,
  onExpenseAdded
}) => {
  const { user } = useAuth()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState(user?.id || '')
  const [splitType, setSplitType] = useState<'equal' | 'manual'>('equal')
  const [splitMethod, setSplitMethod] = useState<'amount' | 'percentage'>('amount')
  const [selectedMembers, setSelectedMembers] = useState<string[]>(members.map(m => m.user_id))
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const expenseAmount = parseFloat(amount)
      if (isNaN(expenseAmount) || expenseAmount <= 0) {
        throw new Error('Please enter a valid amount')
      }

      if (selectedMembers.length === 0) {
        throw new Error('Please select at least one member to split with')
      }

      let splits: { expense_id?: string; user_id: string; amount: number }[] = []

      if (splitType === 'equal') {
        const splitAmount = expenseAmount / selectedMembers.length
        splits = selectedMembers.map(memberId => ({
          user_id: memberId,
          amount: splitAmount
        }))
      } else {
        // Manual split
        if (splitMethod === 'amount') {
          const totalCustomAmount = selectedMembers.reduce((sum, memberId) => {
            const customAmount = parseFloat(customSplits[memberId] || '0')
            return sum + customAmount
          }, 0)

          if (Math.abs(totalCustomAmount - expenseAmount) > 0.01) {
            throw new Error(`Custom amounts must total ${expenseAmount.toFixed(2)}`)
          }

          splits = selectedMembers.map(memberId => ({
            user_id: memberId,
            amount: parseFloat(customSplits[memberId] || '0')
          }))
        } else {
          // Percentage split
          const totalPercentage = selectedMembers.reduce((sum, memberId) => {
            const percentage = parseFloat(customSplits[memberId] || '0')
            return sum + percentage
          }, 0)

          if (Math.abs(totalPercentage - 100) > 0.01) {
            throw new Error('Percentages must total 100%')
          }

          splits = selectedMembers.map(memberId => {
            const percentage = parseFloat(customSplits[memberId] || '0')
            return {
              user_id: memberId,
              amount: (expenseAmount * percentage) / 100
            }
          })
        }
      }

      // Create the expense
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          group_id: groupId,
          description: description.trim(),
          amount: expenseAmount,
          paid_by: paidBy
        })
        .select()
        .single()

      if (expenseError) throw expenseError

      // Update the splits creation
      const splitsWithExpenseId = splits.map(split => ({
        expense_id: expense.id,
        from_user: split.user_id,  // Change from user_id to from_user
        to_user: paidBy,          // Add to_user field
        amount: split.amount,
        settled: false,           // Add settled field
        created_at: new Date().toISOString()
      }))

      // Insert splits
      const { error: splitsError } = await supabase
        .from('expense_splits')
        .insert(splitsWithExpenseId)

      if (splitsError) throw splitsError

      onExpenseAdded()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const updateCustomSplit = (memberId: string, value: string) => {
    setCustomSplits(prev => ({
      ...prev,
      [memberId]: value
    }))
  }

  const getDisplayAmount = (memberId: string) => {
    if (splitType === 'equal') {
      return (parseFloat(amount) / selectedMembers.length || 0).toFixed(2)
    } else if (splitMethod === 'amount') {
      return customSplits[memberId] || '0.00'
    } else {
      const percentage = parseFloat(customSplits[memberId] || '0')
      const amountValue = parseFloat(amount) || 0
      return ((amountValue * percentage) / 100).toFixed(2)
    }
  }

  const getTotalCustomAmount = () => {
    if (splitMethod === 'amount') {
      return selectedMembers.reduce((sum, memberId) => {
        return sum + (parseFloat(customSplits[memberId] || '0'))
      }, 0)
    } else {
      return selectedMembers.reduce((sum, memberId) => {
        return sum + (parseFloat(customSplits[memberId] || '0'))
      }, 0)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-full">
              <Receipt className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Add Expense</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g., Dinner at restaurant"
              required
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="paidBy" className="block text-sm font-medium text-gray-700 mb-2">
              Paid by
            </label>
            <select
              id="paidBy"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              {members.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.email.split('@')[0]} {member.user_id === user?.id && '(You)'}
                </option>
              ))}
            </select>
          </div>

          {/* Split Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Split method
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="equal"
                  checked={splitType === 'equal'}
                  onChange={(e) => setSplitType(e.target.value as 'equal' | 'manual')}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                />
                <span className="ml-2 text-sm text-gray-700">Equal split</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="manual"
                  checked={splitType === 'manual'}
                  onChange={(e) => setSplitType(e.target.value as 'equal' | 'manual')}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                />
                <span className="ml-2 text-sm text-gray-700">Custom split</span>
              </label>
            </div>
          </div>

          {splitType === 'manual' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom split method
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="amount"
                    checked={splitMethod === 'amount'}
                    onChange={(e) => setSplitMethod(e.target.value as 'amount' | 'percentage')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                  />
                  <Calculator className="w-4 h-4 ml-2 mr-1 text-gray-500" />
                  <span className="text-sm text-gray-700">By amount</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="percentage"
                    checked={splitMethod === 'percentage'}
                    onChange={(e) => setSplitMethod(e.target.value as 'amount' | 'percentage')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                  />
                  <Percent className="w-4 h-4 ml-2 mr-1 text-gray-500" />
                  <span className="text-sm text-gray-700">By percentage</span>
                </label>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Split between
            </label>
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.user_id} className="border border-gray-200 rounded-lg p-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.user_id)}
                      onChange={() => toggleMember(member.user_id)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-sm text-gray-700 flex-1">
                      {member.email.split('@')[0]} {member.user_id === user?.id && '(You)'}
                    </span>
                  </label>
                  
                  {selectedMembers.includes(member.user_id) && (
                    <div className="mt-2 flex items-center space-x-2">
                      {splitType === 'manual' ? (
                        <div className="flex items-center space-x-2 flex-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={customSplits[member.user_id] || ''}
                            onChange={(e) => updateCustomSplit(member.user_id, e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            placeholder={splitMethod === 'percentage' ? '0' : '0.00'}
                          />
                          <span className="text-sm text-gray-500">
                            {splitMethod === 'percentage' ? '%' : '$'}
                          </span>
                          {splitMethod === 'percentage' && (
                            <span className="text-sm text-gray-500">
                              = ${getDisplayAmount(member.user_id)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 ml-auto">
                          ${getDisplayAmount(member.user_id)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {splitType === 'manual' && selectedMembers.length > 0 && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Total {splitMethod === 'percentage' ? 'percentage' : 'amount'}:
                  </span>
                  <span className={`font-medium ${
                    Math.abs(getTotalCustomAmount() - (splitMethod === 'percentage' ? 100 : parseFloat(amount || '0'))) > 0.01
                      ? 'text-red-600' 
                      : 'text-green-600'
                  }`}>
                    {splitMethod === 'percentage' 
                      ? `${getTotalCustomAmount().toFixed(1)}%` 
                      : `$${getTotalCustomAmount().toFixed(2)}`
                    }
                  </span>
                </div>
                {splitMethod === 'percentage' && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">Total amount:</span>
                    <span className="font-medium text-gray-900">
                      ${((parseFloat(amount || '0') * getTotalCustomAmount()) / 100).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !description.trim() || !amount || selectedMembers.length === 0}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}