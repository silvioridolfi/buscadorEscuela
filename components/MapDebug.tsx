"use client"

import { useState, useEffect } from "react"

export default function MapDebug() {
  const [apiKeyStatus, setApiKeyStatus] = useState<string>("Checking...")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkApiKey() {
      try {
        const response = await fetch("/api/maps/key")
        if (!response.ok) {
          setApiKeyStatus(`Error: ${response.status}`)
          return
        }

        const data = await response.json()
        setApiKeyStatus(data.isConfigured ? "Configured ✅" : "Not configured ❌")
      } catch (err) {
        setError(`Error checking API key: ${err.message}`)
      }
    }

    checkApiKey()
  }, [])

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4 text-sm">
      <h3 className="font-bold mb-2">Map Debugging Info</h3>
      <p>
        <strong>API Key Status:</strong> {apiKeyStatus}
      </p>
      {error && <p className="text-red-500">{error}</p>}
      <p className="mt-2 text-xs text-gray-500">This debug panel is only visible during development.</p>
    </div>
  )
}
