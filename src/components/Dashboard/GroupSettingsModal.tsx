import React, { useState } from 'react'
import { X, Settings, Trash2, UserMinus, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

interface Member {
  id: string
  user_id: string
  email: string
  joined_at: string
}

interface Group {
  id: string
  name: string
  description?: string
  created_by: string
  created_at: string
}

interface GroupSettingsModalProps {
  group: Group
  members: Member[]
  onClose: () => void
  onUpdate: () => void
}

export const GroupSettingsModal: React.FC<GroupSettingsModalProps> = ({
  group,
  members,
  onClose,
  onUpdate
}) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const removeMember = async (memberId: string, memberUserId: string) => {
    if (memberUserId === group.created_by) {
      setError('Cannot remove the group creator')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error: deleteError } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId)

      if (deleteError) throw deleteError

      onUpdate()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteGroup = async () => {
    setLoading(true)
    setError('')

    try {
      const { error: deleteError } = await supabase
        .from('groups')
        .delete()
        .eq('id', group.id)

      if (deleteError) throw deleteError

      onClose()
      // Navigate back to dashboard
      window.location.reload()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-full">
              <Settings className="w-5 h-5 text-gray-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Group Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Group Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Group Information</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-600">Name:</span>
                <p className="text-gray-900">{group.name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Description:</span>
                <p className="text-gray-900">{group.description || 'No description'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Created:</span>
                <p className="text-gray-900">
                  {new Date(group.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Member Management */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Manage Members</h3>
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                    {member.user_id === group.created_by ? (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                        Creator
                      </span>
                    ) : (
                      <button
                        onClick={() => removeMember(member.id, member.user_id)}
                        disabled={loading}
                        className="p-1 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                        title="Remove member"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-red-600 mb-3 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Danger Zone</span>
            </h3>
            
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Group</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Warning:</strong> This action cannot be undone. All expenses, splits, and settlements will be permanently deleted.
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteGroup}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Deleting...' : 'Delete Forever'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}