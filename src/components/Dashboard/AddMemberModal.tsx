import React, { useState } from 'react'
import { X, UserPlus, Mail, Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface AddMemberModalProps {
  groupId: string
  onClose: () => void
  onMemberAdded: () => void
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  groupId,
  onClose,
  onMemberAdded
}) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

const searchUsers = async (searchEmail: string) => {
  if (!searchEmail.trim()) {
    setSearchResults([])
    return
  }

  setSearching(true)
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email') // Include other fields if needed
      .ilike('email', `%${searchEmail}%`) // Use ilike for case-insensitive search

    if (error) throw error

    setSearchResults(data || [])
  } catch (err: any) {
    console.error('Error searching users:', err)
    setSearchResults([])
  } finally {
    setSearching(false)
  }
}


  const addMember = async (userId: string, userEmail: string) => {
    setLoading(true)
    setError('')

    try {
      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single()

      if (existingMember) {
        throw new Error('User is already a member of this group')
      }

      // Add user to group
      const { error: insertError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: userId
        })

      if (insertError) throw insertError

      onMemberAdded()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    searchUsers(value)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Add Member</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Search by email
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailSearch}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter email address"
              />
            </div>
          </div>

          {searching && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Search Results</h3>
              {searchResults.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.email?.split('@')[0]}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => addMember(user.id, user.email)}
                    disabled={loading}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {email && searchResults.length === 0 && !searching && (
            <div className="text-center py-4">
              <Mail className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No users found with that email</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="pt-4">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}