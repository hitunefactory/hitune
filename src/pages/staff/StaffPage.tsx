import React, { useState, useEffect } from 'react'
import {
  Users,
  UserPlus,
  Shield,
  Phone,
  Mail,
  Building,
  CheckCircle,
} from 'lucide-react'
import { dataService } from '../../services/dataService'
import { Profile, UserRole } from '../../types/database'
import { ROLE_LABELS_BN } from '../../lib/constants'
import { UserAvatar } from '../../components/ui/UserAvatar'

export const StaffPage: React.FC = () => {
  const [staffList, setStaffList] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  // Add Staff Modal
  const [showModal, setShowModal] = useState(false)
  const [fullName, setFullName] = useState('')
  const [bengaliName, setBengaliName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<UserRole>('AUDIO_DESIGNER')
  const [department, setDepartment] = useState('AUDIO')

  const loadStaff = async () => {
    setLoading(true)
    try {
      const list = await dataService.getStaff()
      setStaffList(list)
    } catch (err) {
      console.error('Failed to load staff roster:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStaff()
  }, [])

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) return

    try {
      await dataService.createStaff({
        full_name: fullName.trim(),
        bengali_name: bengaliName.trim() || fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role,
        roles: [role],
        department,
      })
      setShowModal(false)
      setFullName('')
      setBengaliName('')
      setEmail('')
      setPhone('')
      loadStaff()
    } catch (err) {
      console.error('Create staff failed:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-purple-400" />
            <span>টিম ও ইউজার</span>
          </h1>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition transform active:scale-95"
        >
          <UserPlus className="h-4 w-4" />
          <span>নতুন স্টাফ যোগ করুন</span>
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffList.map((member) => {
          const roleConf = ROLE_LABELS_BN[member.role] || ROLE_LABELS_BN.AUDIO_DESIGNER

          return (
            <div
              key={member.id}
              className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    src={member.avatar_url}
                    name={member.bengali_name || member.full_name}
                    size="lg"
                  />
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-white text-sm truncate">
                      {member.bengali_name || member.full_name}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">{member.full_name}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${roleConf.color}`}>
                      {roleConf.title}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-500" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-500" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Building className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-slate-400">{member.department || 'সাধারণ'} বিভাগ</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>সক্রিয় অ্যাকাউন্ট</span>
                </div>
                <span>জামালপুর সদর</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Permissions Matrix */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-400" />
          <span>সিস্টেম পারমিশন ও দায়িত্ব বণ্টন তালিকা (RBAC)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(ROLE_LABELS_BN).map(([k, v]) => (
            <div key={k} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${v.color}`}>
                {v.title}
              </span>
              <p className="text-xs text-slate-300 pt-1 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ADD STAFF MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-sm">নতুন টিম সদস্য যোগ করুন</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">ইংরেজি নাম</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Shakil Ahmed"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">বাংলা নাম</label>
                <input
                  type="text"
                  value={bengaliName}
                  onChange={(e) => setBengaliName(e.target.value)}
                  placeholder="শাকিল আহমেদ"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">ইমেইল ঠিকানা</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="shakil@hitunestudio.com"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">মোবাইল নম্বর</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017xxxxxxxx"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">ভূমিকা (Role)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                >
                  {Object.entries(ROLE_LABELS_BN).map(([k, v]) => (
                    <option key={k} value={k}>{v.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
                >
                  স্টাফ সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
