import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="h-16 w-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertCircle className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">পেজ লোড করতে সমস্যা হয়েছে</h2>
            <p className="text-xs text-slate-400 max-w-md">
              সিস্টেমে সাময়িক সমস্যা হয়েছে। দয়া করে পেজটি রিফ্রেশ করুন অথবা ড্যাশবোর্ডে ফিরে যান।
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>পেজ রিফ্রেশ করুন</span>
            </button>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
            >
              ড্যাশবোর্ডে যান
            </a>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
