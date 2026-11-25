import React, { useState, useEffect } from 'react'
import {
  Settings,
  Database,
  Building,
  Key,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Copy,
  ExternalLink,
  RefreshCw,
  Check,
  Globe,
  FolderKanban,
  Plus,
  X,
  Save,
} from 'lucide-react'
import { checkSupabaseHealth, isSupabaseConfigured, SupabaseHealth } from '../../integrations/supabase/client'
import { dataService } from '../../services/dataService'
import { OrderCategory, DynamicFormType } from '../../types/database'
import { useBackOverlay } from '../../hooks/useBackOverlay'

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<SupabaseHealth | null>(null)
  const [checking, setChecking] = useState(false)
  const [copiedMigration1, setCopiedMigration1] = useState(false)
  const [copiedMigration2, setCopiedMigration2] = useState(false)

  // Categories
  const [categories, setCategories] = useState<OrderCategory[]>([])
  const [showCatModal, setShowCatModal] = useState(false)
  const [catName, setCatName] = useState('')
  const [catNameBn, setCatNameBn] = useState('')
  const [catFormType, setCatFormType] = useState<DynamicFormType>('GENERAL')
  const [savingCat, setSavingCat] = useState(false)

  useBackOverlay(showCatModal && !savingCat, () => setShowCatModal(false))

  const loadCategories = async () => {
    try {
      const list = await dataService.getCategories()
      setCategories(list)
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  const runHealthCheck = async () => {
    setChecking(true)
    try {
      const res = await checkSupabaseHealth()
      setHealth(res)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    runHealthCheck()
    loadCategories()
  }, [])

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!catName.trim() || !catNameBn.trim()) return

    setSavingCat(true)
    try {
      const slug = catName.trim().toLowerCase().replace(/\s+/g, '-')
      await dataService.createCategory({
        name: catName.trim(),
        name_bn: catNameBn.trim(),
        slug,
        dynamic_form_type: catFormType,
      })
      setShowCatModal(false)
      setCatName('')
      setCatNameBn('')
      setCatFormType('GENERAL')
      loadCategories()
    } catch (err) {
      console.error('Create category failed:', err)
    } finally {
      setSavingCat(false)
    }
  }

  const copyPath = (path: string, type: 1 | 2) => {
    navigator.clipboard.writeText(path)
    if (type === 1) {
      setCopiedMigration1(true)
      setTimeout(() => setCopiedMigration1(false), 2000)
    } else {
      setCopiedMigration2(true)
      setTimeout(() => setCopiedMigration2(false), 2000)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="h-6 w-6 text-slate-400" />
            <span>স্টুডিও সেটিংস ও সিস্টেম কনফিগারেশন</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            স্টুডিও পরিচিতি, সুপাবেস (Supabase) ক্লাউড ডাটাবেজ ও ক্লাউডফ্লেয়ার ডিপ্লয়মেন্ট
          </p>
        </div>

        <button
          onClick={runHealthCheck}
          disabled={checking}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${checking ? 'animate-spin text-blue-400' : ''}`} />
          <span>কানেকশন টেস্ট করুন</span>
        </button>
      </div>

      {/* Cloudflare Pages Readiness Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-orange-950/30 via-slate-900 to-[#0b1120] border border-orange-500/30 shadow-xl space-y-2">
        <div className="flex items-center gap-2 text-orange-400 font-bold text-sm">
          <Globe className="h-4 w-4" />
          <span>ক্লাউডফ্লেয়ার পেজেস (Cloudflare Pages) ডিপ্লয়মেন্ট প্রস্তুত</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          SPA রাউটিংয়ের জন্য <code className="text-orange-300">public/_redirects</code> এবং সিকিউরিটি হেডার <code className="text-orange-300">public/_headers</code> কনফিগার করা হয়েছে। Cloudflare Pages-এ গিটহাবের সাথে যুক্ত করে সরাসরি ডিপ্লয় করতে পারবেন।
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300">
            <strong>Build Command:</strong> <code className="text-blue-400 font-mono">npm run build</code>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300">
            <strong>Build Output Directory:</strong> <code className="text-emerald-400 font-mono">dist</code>
          </div>
        </div>
      </div>

      {/* Supabase Connection Status Card */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
          <Database className="h-4 w-4 text-emerald-400" />
          <span>সুপাবেস (Supabase) ক্লাউড ডাটাবেজ স্থিতি</span>
        </h2>

        {health?.tablesCreated ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-3">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <div>
              <div className="font-bold text-sm">সুপাবেস ক্লাউড ডাটাবেজ সম্পূর্ণ সক্রিয়!</div>
              <div className="text-[11px] text-emerald-300/90 mt-0.5">
                আপনার লাইভ পোস্টগ্রেসকিউএল টেবিল, RLS সিকিউরিটি পলিসি এবং অটো-প্রোফাইল ট্রিগার সচল রয়েছে।
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm text-white">সুপাবেস প্রজেক্ট সংযুক্ত হয়েছে!</div>
                <div className="text-[11px] text-blue-200 mt-1 leading-relaxed">
                  আপনার প্রজেক্ট (<code className="text-blue-300">rebwquvphyrfhwqbdojs</code>) সক্রিয় রয়েছে। টেবিল এক্সেস ও অটোমেটিক প্রোফাইল ট্রিগার সক্রিয় করার জন্য নিচের SQL স্ক্রিপ্টটি সুপাবেস SQL Editor-এ রান করুন।
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">সুপাবেস SQL Editor-এ মাইগ্রেশন রান করুন:</span>
                <a
                  href="https://supabase.com/dashboard/project/rebwquvphyrfhwqbdojs/sql/new"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
                >
                  <span>সুপাবেস SQL Editor খুলুন</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div>
                    <span className="font-semibold text-white block">মেইন স্কিমা (২২টি টেবিল):</span>
                    <span className="text-[11px] text-slate-400">supabase/migrations/20261123000001_initial_schema.sql</span>
                  </div>
                  <button
                    onClick={() => copyPath('supabase/migrations/20261123000001_initial_schema.sql', 1)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] flex items-center gap-1"
                  >
                    {copiedMigration1 ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedMigration1 ? 'কপি হয়েছে' : 'পাথ কপি'}</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div>
                    <span className="font-semibold text-white block">অথেনটিকেশন ট্রিগার ও আরএলএস পারমিশন:</span>
                    <span className="text-[11px] text-slate-400">supabase/migrations/20261123000002_auth_and_permissions.sql</span>
                  </div>
                  <button
                    onClick={() => copyPath('supabase/migrations/20261123000002_auth_and_permissions.sql', 2)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] flex items-center gap-1"
                  >
                    {copiedMigration2 ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedMigration2 ? 'কপি হয়েছে' : 'পাথ কপি'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400 block">প্রজেক্ট URL:</span>
            <code className="text-blue-400 font-mono text-[11px] block truncate">
              https://rebwquvphyrfhwqbdojs.supabase.co
            </code>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400 block">প্রজেক্ট আইডি:</span>
            <code className="text-slate-200 font-mono text-[11px] block truncate">
              rebwquvphyrfhwqbdojs
            </code>
          </div>
        </div>
      </div>

      {/* Order Categories Management */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-purple-400" />
            <div>
              <h2 className="text-sm font-bold text-white">অর্ডার ক্যাটাগরি ব্যবস্থাপনা</h2>
              <p className="text-[11px] text-slate-400">স্টুডিওর সক্রিয় অর্ডার ক্যাটাগরি ও ডাইনামিক ফর্ম ধরন</p>
            </div>
          </div>

          <button
            onClick={() => setShowCatModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>নতুন ক্যাটাগরি</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white truncate">{cat.name_bn}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                  {cat.dynamic_form_type}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">{cat.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Add Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">নতুন অর্ডার ক্যাটাগরি যোগ করুন</h3>
              <button
                onClick={() => setShowCatModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">বাংলা নাম *</label>
                <input
                  type="text"
                  value={catNameBn}
                  onChange={(e) => setCatNameBn(e.target.value)}
                  placeholder="যেমন: ইউটিউব শর্টস অডিও"
                  required
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">ইংরেজি নাম *</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. YouTube Shorts Audio"
                  required
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">ডাইনামিক ফর্ম ধরন</label>
                <select
                  value={catFormType}
                  onChange={(e) => setCatFormType(e.target.value as DynamicFormType)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="GENERAL">সাধারণ ফর্ম (General)</option>
                  <option value="ELECTION">নির্বাচনী প্রচারণা গান ফর্ম (Election)</option>
                  <option value="WAZ">ওয়াজ মাহফিল মাইকিং ফর্ম (Waz)</option>
                  <option value="SCHOOL">স্কুল / মাদ্রাসা ভর্তি ফর্ম (School)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingCat}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
                >
                  {savingCat ? 'সংরক্ষণ হচ্ছে...' : 'ক্যাটাগরি যুক্ত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Studio Profile */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
          <Building className="h-4 w-4 text-blue-400" />
          <span>স্টুডিও পরিচিতি</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 block">স্টুডিও নাম:</span>
            <input
              type="text"
              readOnly
              value="HI TUNE STUDIO"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-bold"
            />
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 block">লোকেশন:</span>
            <input
              type="text"
              readOnly
              value="জামালপুর সদর, জামালপুর, বাংলাদেশ"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
            />
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 block">মুদ্রা (Currency):</span>
            <input
              type="text"
              readOnly
              value="বাংলাদেশী টাকা (BDT ৳)"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
            />
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 block">ডিফল্ট ভাষা:</span>
            <input
              type="text"
              readOnly
              value="বাংলা (Bengali First)"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
