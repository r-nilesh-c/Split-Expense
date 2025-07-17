import React, { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Users, Receipt, DollarSign, Calendar, UserPlus, Settings } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { AddExpenseModal } from './AddExpenseModal'
import { ExpenseCard } from './ExpenseCard'
import { BalanceCard } from './BalanceCard'
import { SettlementCard } from './SettlementCard'
import { AddMemberModal } from './AddMemberModal'
import { GroupSettingsModal } from './GroupSettingsModal'

interface Group {
  id: string
  name: string
  description: string
  created_by: string
  created_at: string
  member_count?: number
  total_expenses?: number
  your_balance?: number
}

interface GroupDetailProps {
  group: Group
  onBack: () => void
  onUpdate: () => void
}

interface Expense {
  id: string
  description: string
  amount: number
  paid_by: string
  created_at: string
  paid_by_email?: string
}

interface Member {
  id: string
  user_id: string
  email: string
  joined_at: string
  upi_qr_code_url?: string
}

interface Settlement {
  id: string
  group_id: string
  from_user: string
  to_user: string
  amount: number
  status: string
  payment_method?: string
  settled_at: string
  from_user_email?: string
  to_user_email?: string
  to_user_qr_code?: string
}

export const GroupDetail: React.FC<GroupDetailProps> = ({ group, onBack, onUpdate }) => {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isGroupCreator, setIsGroupCreator] = useState(false)

  useEffect(() => {
    fetchGroupData()
    fetchSettlements()
    setIsGroupCreator(group.created_by === user?.id)
  }, [group.id])

  const fetchGroupData = async () => {
    try {
      // Fetch expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('group_id', group.id)
        .order('created_at', { ascending: false })

      if (expensesError) throw expensesError

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
  .from('group_members')
  .select(`
    id,
    user_id,
    joined_at,
    profiles ( email, upi_qr_code_url )
  `)
  .eq('group_id', group.id)

if (membersError) throw membersError



      

      // Get expense splits for each expense
      const expenseIds = expensesData.map(e => e.id)
      const { data: splitsData, error: splitsError } = await supabase
  .from('expense_splits')
  .select(`
    *,
    profiles:profiles!expense_splits_user_id_fkey(email)
  `)
  .in('expense_id', expenseIds)


      if (splitsError) throw splitsError

      const membersWithEmails = membersData.map(member => ({
  ...member,
  email: member.profiles?.email || 'Unknown',
  upi_qr_code_url: member.profiles?.upi_qr_code_url
}))

      // Get user emails for expenses
      const expensesWithEmails = expensesData.map(expense => {
  const expenseSplits = splitsData
    .filter(split => split.expense_id === expense.id)
    .map(split => ({
      ...split,
      email: split.profiles?.email || 'Unknown'
    }))

  const paidBySplit = expenseSplits.find(split => split.user_id === expense.paid_by)
  return {
    ...expense,
    paid_by_email: paidBySplit?.email || 'Unknown',
    splits: expenseSplits
  }
})


      setExpenses(expensesWithEmails)
      setMembers(membersWithEmails)
    } catch (error) {
      console.error('Error fetching group data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSettlements = async () => {
    try {
      const { data: settlementsData, error: settlementsError } = await supabase
        .from('settlements')
        .select(`
          *,
          from_profile:profiles!settlements_from_user_fkey(email),
          to_profile:profiles!settlements_to_user_fkey(email, upi_qr_code_url)
        `)
        .eq('group_id', group.id)
        .order('settled_at', { ascending: false })

      if (settlementsError) throw settlementsError

      // Get user profiles for settlements
      const userIds = [...new Set([
        ...settlementsData.map(s => s.from_user),
        ...settlementsData.map(s => s.to_user)
      ])]

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, upi_qr_code_url')
        .in('id', userIds)

      if (profilesError) throw profilesError

      const profilesMap = profilesData.reduce((acc, profile) => {
        acc[profile.id] = profile
        return acc
      }, {} as Record<string, any>)

      const settlementsWithEmails = settlementsData.map(settlement => ({
        ...settlement,
        from_user_email: profilesMap[settlement.from_user]?.email || 'Unknown',
        to_user_email: profilesMap[settlement.to_user]?.email || 'Unknown',
        to_user_qr_code: profilesMap[settlement.to_user]?.upi_qr_code_url
      }))

      setSettlements(settlementsWithEmails)
    } catch (error) {
      console.error('Error fetching settlements:', error)
    }
  }

  const handleExpenseAdded = () => {
    fetchGroupData()
    fetchSettlements()
    setShowAddExpense(false)
    onUpdate()
  }

  const handleSettlementUpdate = () => {
    fetchSettlements()
    onUpdate()
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const averagePerPerson = members.length > 0 ? totalExpenses / members.length : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
              <p className="text-gray-600 mt-1">{group.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {isGroupCreator && (
              <>
                <button
                  onClick={() => setShowAddMember(true)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Add Member</span>
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
              </>
            )}
            <button
              onClick={() => setShowAddExpense(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Expenses */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Expenses</h2>
                {expenses.length === 0 ? (
                  <div className="text-center py-8">
                    <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No expenses yet</p>
                    <p className="text-sm text-gray-500">Add your first expense to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {expenses.map((expense) => (
                      <ExpenseCard key={expense.id} expense={expense} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Summary & Members */}
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Expenses</span>
                    <span className="font-bold text-gray-900">${totalExpenses.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average per person</span>
                    <span className="font-bold text-gray-900">${averagePerPerson.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Members</span>
                    <span className="font-bold text-gray-900">{members.length}</span>
                  </div>
                </div>
              </div>

              {/* Balances */}
              <BalanceCard 
                groupId={group.id} 
                members={members} 
                onSettlementCreated={() => {
                  fetchGroupData()
                  fetchSettlements()
                  onUpdate()
                }}
              />

              {/* Settlements */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Settlements</h3>
                {settlements.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">No settlements yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {settlements
                      .filter(settlement => 
                        settlement.from_user === user?.id || settlement.to_user === user?.id
                      )
                      .map((settlement) => (
                        <SettlementCard
                          key={settlement.id}
                          settlement={settlement}
                          onUpdate={handleSettlementUpdate}
                        />
                      ))}
                  </div>
                )}
              </div>

              {/* Members */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Members</h3>
                  {isGroupCreator && (
                    <button
                      onClick={() => setShowAddMember(true)}
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {member.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.email.split('@')[0]}</p>
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {member.user_id === user?.id && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            You
                          </span>
                        )}
                        {member.user_id === group.created_by && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            Creator
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showAddExpense && (
        <AddExpenseModal
          groupId={group.id}
          members={members}
          onClose={() => setShowAddExpense(false)}
          onExpenseAdded={handleExpenseAdded}
        />
      )}

      {showAddMember && (
        <AddMemberModal
          groupId={group.id}
          onClose={() => setShowAddMember(false)}
          onMemberAdded={() => {
            fetchGroupData()
            fetchSettlements()
            setShowAddMember(false)
            onUpdate()
          }}
        />
      )}

      {showSettings && (
        <GroupSettingsModal
          group={group}
          members={members}
          onClose={() => setShowSettings(false)}
          onUpdate={() => {
            fetchGroupData()
            fetchSettlements()
            onUpdate()
          }}
        />
      )}
    </div>
  )
}