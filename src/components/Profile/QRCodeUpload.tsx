import React, { useState, useRef } from 'react'
import { Upload, QrCode, X, Check, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

interface QRCodeUploadProps {
  currentQRUrl?: string
  onQRUpdated: (url: string | null) => void
}

export const QRCodeUpload: React.FC<QRCodeUploadProps> = ({ currentQRUrl, onQRUpdated }) => {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    setError('')
    setSuccess('')
  }

  const uploadQRCode = async () => {
    if (!fileInputRef.current?.files?.[0] || !user) return

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      const file = fileInputRef.current.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}-${file.name}`

      // Delete existing QR code if it exists
      if (currentQRUrl) {
        // Extract the path after the bucket name from the URL
        const urlParts = currentQRUrl.split('/qrcodes/')
        const oldFileName = urlParts[1]
        if (oldFileName) {
          await supabase.storage
            .from('qrcodes')
            .remove([oldFileName])
        }
      }

      // Upload new QR code
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('qrcodes')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('qrcodes')
        .getPublicUrl(fileName)

      // Update profile with new QR code URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ upi_qr_code_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setSuccess('QR code uploaded successfully!')
      onQRUpdated(publicUrl)
      setPreviewUrl(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload QR code')
    } finally {
      setUploading(false)
    }
  }

  const removeQRCode = async () => {
    if (!currentQRUrl || !user) return

    setUploading(true)
    setError('')

    try {
      // Delete from storage
      const urlParts = currentQRUrl.split('/qrcodes/')
      const fileName = urlParts[1]
      if (fileName) {
        await supabase.storage
          .from('qrcodes')
          .remove([fileName])
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ upi_qr_code_url: null })
        .eq('id', user.id)

      if (updateError) throw updateError

      setSuccess('QR code removed successfully!')
      onQRUpdated(null)
    } catch (err: any) {
      setError(err.message || 'Failed to remove QR code')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-full">
          <QrCode className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">UPI QR Code</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Upload your UPI QR code so others can easily pay you back for shared expenses.
      </p>

      {currentQRUrl && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Current QR Code:</p>
          <div className="relative inline-block">
            <img
              src={currentQRUrl}
              alt="Current UPI QR Code"
              className="w-32 h-32 object-cover rounded-lg border border-gray-200"
            />
            <button
              onClick={removeQRCode}
              disabled={uploading}
              className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors disabled:opacity-50"
              title="Remove QR code"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
          <img
            src={previewUrl}
            alt="QR Code Preview"
            className="w-32 h-32 object-cover rounded-lg border border-gray-200"
          />
        </div>
      )}

      <div className="space-y-4">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="qr-upload"
          />
          <label
            htmlFor="qr-upload"
            className="flex items-center justify-center space-x-2 w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 cursor-pointer transition-colors"
          >
            <Upload className="w-5 h-5 text-gray-500" />
            <span className="text-gray-600">
              {currentQRUrl ? 'Replace QR Code' : 'Select QR Code Image'}
            </span>
          </label>
        </div>

        {previewUrl && (
          <button
            onClick={uploadQRCode}
            disabled={uploading}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload QR Code</span>
              </>
            )}
          </button>
        )}

        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Check className="w-4 h-4 text-green-600" />
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}
      </div>
    </div>
  )
}