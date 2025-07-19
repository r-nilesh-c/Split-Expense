import React, { useState } from 'react'
import { QrCode, Check, X, User, DollarSign, Calendar } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

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

interface SettlementCardProps {
  settlement: Settlement
  onUpdate: () => void
}

export const SettlementCard: React.FC<SettlementCardProps> = ({ settlement, onUpdate }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showQR, setShowQR] = useState(false)

  const isDebtor = settlement.from_user === user?.id
  const isCreditor = settlement.to_user === user?.id

  const confirmReceived = async () => {
    setLoading(true)
    setError('')
    try {
      const { error: updateError } = await supabase
        .from('settlements')
        .update({
          status: 'paid',
          settled_at: new Date().toISOString()
        })
        .eq('id', settlement.id)
      if (updateError) throw updateError
      onUpdate()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const markAsPaid = async (paymentMethod: 'manual' | 'upi_qr' = 'manual') => {
    setLoading(true)
    setError('')
    try {
      const { error: updateError } = await supabase
        .from('settlements')
        .update({
          status: 'pending', // <-- Change here
          payment_method: paymentMethod,
          // Do NOT set settled_at yet
        })
        .eq('id', settlement.id)

      if (updateError) throw updateError

      onUpdate()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Show confirm button to creditor if status is pending
  if (settlement.status === 'pending' && isCreditor) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">
              You are owed ${settlement.amount.toFixed(2)} from {settlement.from_user_email?.split('@')[0]}
            </p>
            <p className="text-sm text-gray-600">
              Waiting for your confirmation
            </p>
          </div>
          <button
            onClick={confirmReceived}
            disabled={loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Confirming...' : 'Confirm received'}
          </button>
        </div>
        {error && (
          <div className="mt-2 text-sm text-red-600">{error}</div>
        )}
      </div>
    )
  }

  if (settlement.status === 'paid') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-full">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-900">
                {isDebtor ? 'You paid' : 'You received'} ${settlement.amount.toFixed(2)}
              </p>
              <p className="text-sm text-green-700">
                {isDebtor ? `to ${settlement.to_user_email?.split('@')[0]}` : `from ${settlement.from_user_email?.split('@')[0]}`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-green-600 font-medium">Paid</p>
            <p className="text-xs text-green-500">
              {settlement.payment_method === 'upi_qr' ? 'via UPI' : 'Manual'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 rounded-full">
            <DollarSign className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {isDebtor ? 'You owe' : 'You are owed'} ${settlement.amount.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              {isDebtor ? `to ${settlement.to_user_email?.split('@')[0]}` : `from ${settlement.from_user_email?.split('@')[0]}`}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">
            {formatDate(settlement.settled_at)}
          </span>
        </div>
      </div>

      {isDebtor && (
        <div className="flex flex-wrap gap-2">
          {settlement.to_user_qr_code && (
            <button
              onClick={() => setShowQR(!showQR)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-colors text-sm"
            >
              <QrCode className="w-4 h-4" />
              <span>{showQR ? 'Hide QR' : 'Show QR'}</span>
            </button>
          )}
          
          <button
            onClick={() => markAsPaid('manual')}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{loading ? 'Marking...' : 'Mark as Paid'} </span>
          </button>
        </div>
      )}

      {showQR && settlement.to_user_qr_code && (
        <div className="mt-4 p-4fz bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Scan to pay Hello {settlement.to_user_email?.split('@')[0]}
            </p>
            <div className="inline-block p-2 bg-white rounded-lg shadow-sm">
              <img
                src={settlement.to_user_qr_code}
                alt="UPI QR Code"
                className="w-48 h-48 object-cover rounded"
              />
            </div>
            <div className="mt-3 flex justify-center space-x-2">
              <button
                onClick={() => markAsPaid('upi_qr')}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{loading ? 'Marking...' : 'I have paid via UPI'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  )
}