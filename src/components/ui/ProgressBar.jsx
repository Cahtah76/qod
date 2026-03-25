import React from 'react'

export default function ProgressBar({ value, label, showValue = true, color = 'blue', height = 'h-2' }) {
  const colors = {
    blue: 'bg-blue-600',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    gray: 'bg-gray-400',
  }
  const trackColors = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    yellow: 'bg-yellow-100',
    red: 'bg-red-100',
    gray: 'bg-gray-200',
  }

  const barColor = value === 100 ? colors.green : value >= 50 ? colors.blue : value > 0 ? colors.yellow : colors.gray
  const trackColor = value === 100 ? trackColors.green : trackColors.blue

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-xs text-gray-600">{label}</span>}
          {showValue && <span className="text-xs font-medium text-gray-700">{value}%</span>}
        </div>
      )}
      <div className={`w-full ${trackColor} rounded-full ${height} overflow-hidden`}>
        <div
          className={`${barColor} ${height} rounded-full transition-all duration-300`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
