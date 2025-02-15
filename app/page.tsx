import SchoolSearch from "@/components/SchoolSearch"
import { Encode_Sans } from "next/font/google"

const encodeSans = Encode_Sans({ subsets: ["latin"] })

export default function Home() {
  return (
    <main className={`min-h-screen bg-[#00AEC3] text-white p-4 ${encodeSans.className}`}>
      <h1 className="mb-4 text-3xl font-bold">Buscador de establecimientos educativos</h1>

      <SchoolSearch />
    </main>
  )
}

