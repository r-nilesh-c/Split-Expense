import React from 'react'
import { Users, DollarSign, Calendar } from 'lucide-react'

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

interface GroupCardProps {
  group: Group
  onClick: () => void
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, onClick }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div
      onClick={onClick}
      className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 cursor-pointer transition-all duration-200 hover:shadow-xl hover:transform hover:scale-105 group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
            {group.name}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2">{group.description}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {group.member_count} member{group.member_count !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-green-600">
              ${(group.total_expenses || 0).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            Created {formatDate(group.created_at)}
          </span>
        </div>

        <div className="pt-3 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Your balance:</span>
            <span className={`text-sm font-medium ${
              (group.your_balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${Math.abs(group.your_balance || 0).toFixed(2)}
              {(group.your_balance || 0) < 0 && ' owed'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}