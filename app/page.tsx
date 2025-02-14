import SchoolSearch from "@/components/SchoolSearch"

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">School Information Search</h1>
      <p className="mb-4">Enter CUE, school name, or any other details to search for school information.</p>
      <SchoolSearch />
    </main>
  )
}

