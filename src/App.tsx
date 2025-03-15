import { Settings, ChevronDown } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-500 text-white p-4 shadow">
        <h1 className="text-2xl font-bold">Prompter PWA</h1>
      </header>

      <div className="p-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Tailwind is working if this is styled
          </h2>

          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center">
            See more <ChevronDown className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
