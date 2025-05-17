"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { Search, Loader2, X } from "lucide-react"

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

  const clearSearch = () => {
    setQuery("")
    startTransition(() => {
      onSearch("")
    })
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
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                aria-label="Clear search"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending || !query.trim()}
              className="h-12 px-6 rounded-lg pba-gradient text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center flex-1 md:flex-none"
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
            {query.trim() && (
              <button
                type="button"
                onClick={clearSearch}
                className="h-12 px-4 rounded-lg bg-gray-700/50 text-white font-medium hover:bg-gray-700/70 transition-colors flex items-center justify-center"
                disabled={isPending}
              >
                <X className="h-5 w-5" />
                <span className="ml-2 hidden md:inline">Limpiar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  )
}
