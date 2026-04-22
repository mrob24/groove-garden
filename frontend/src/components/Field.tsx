"use client"

import React from 'react'

export interface FieldProps {
  label: string
  hint?: string
  children: React.ReactNode
  className?: string
}

export default function Field({ label, hint, children, className = '' }: FieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-xs font-medium text-[#8ab89a]">{label}</label>
      {children}
      {hint && (
        <p className="text-[10px] text-[#4a7a5a]">{hint}</p>
      )}
    </div>
  )
}
