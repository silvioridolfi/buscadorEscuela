"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { Search, Loader2 } from "lucide-react"

interface SearchFormProps {
  onSearch: (query: string) => Promise<void>
}

export default function SearchForm({ onSearch }: SearchFormProps) {
  const [query, setQuery] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      startTransition(() => {
        onSearch(query)
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" />
            <input
              type="text"
              placeholder="Buscar por CUE, nombre o distrito..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-12 pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
              disabled={isPending}
            />
          </div>
          <button
            type="submit"
            disabled={isPending || !query.trim()}
            className="h-12 px-6 rounded-lg pba-gradient text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Buscando...
              </>
            ) : (
              "Buscar"
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
