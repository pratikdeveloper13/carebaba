export type VaccineStatus = 'upcoming' | 'completed' | 'missed'

export interface VaccineRecord {
  id: string
  name: string
  doseNumber?: number
  totalDoses?: number
  dueDate: string // YYYY-MM-DD
  dueTime?: string // HH:mm
  completedDate?: string // YYYY-MM-DD, set when status becomes 'completed'
  completedTime?: string
  status: VaccineStatus
  doctorOrHospital?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export type NewVaccineRecord = Omit<
  VaccineRecord,
  'id' | 'createdAt' | 'updatedAt' | 'status' | 'completedDate' | 'completedTime'
>
