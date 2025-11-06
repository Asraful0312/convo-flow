import { FormData } from '@/lib/form-types'
import { Sparkles } from 'lucide-react'
import React from 'react'

const OverLimitScreen = ({primaryColor, form }: { primaryColor:  string, form: FormData}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
        <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: primaryColor }}
            >
              <Sparkles className="w-7 h-7 text-white" />
            </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{form.title}</h1>
        <p className="text-lg text-red-600 max-w-2xl mb-6">
            This form has reached its monthly response limit.
        </p>
        <p className="text-sm text-gray-500">Please contact the form owner ({form.ownerName}) for more information.</p>
      </div>
  )
}

export default OverLimitScreen