// components/DatePicker.tsx
'use client'

import React from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

type Props = {
  selectedDate: Date | null
  onChange: (date: Date | null) => void
}

export default function CustomDatePicker({ selectedDate, onChange }: Props) {
  return (
    <div>
      <DatePicker
        selected={selectedDate}
        onChange={onChange}
        minDate={new Date()}
        dateFormat="yyyy-MM-dd"
        className="border px-4 py-2 rounded"
        placeholderText="Select a date"
      />
    </div>
  )
}
