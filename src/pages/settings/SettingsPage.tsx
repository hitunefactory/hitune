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
} from 'lucide-react'
import { checkSupabaseHealth, isSupabaseConfigured, SupabaseHealth } from '../../integrations/supabase/client'

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<SupabaseHealth | null>(null)
  const [checking, setChecking] = useState(false)
  const [copiedMigration1, setCopiedMigration1] = useState(false)
  const [copiedMigration2, setCopiedMigration2] = useState(false)

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
  }, [])

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
