import { useState } from "react";

export default function CustomizationPage() {
  const [selectedTheme, setSelectedTheme] = useState("dark");

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-2">Cor de tema</h2>
      <p className="text-gray-400 mb-6">
        Selecione um tema para deixar sua rifa ainda mais elegante
      </p>

      {/* Grid responsivo para os cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {/* Card Claro */}
        <div
          onClick={() => setSelectedTheme("light")}
          className={`cursor-pointer rounded-lg border p-4 shadow-sm transition ${
            selectedTheme === "light"
              ? "border-blue-500 ring-2 ring-blue-500"
              : "border-gray-700"
          }`}
        >
          <h3 className="font-semibold">Rifa do iPhone</h3>
          <p className="text-sm text-gray-400">R$ 5,00 por bilhete</p>
          <div className="mt-2 bg-gray-200 h-2 rounded">
            <div className="w-1/3 h-2 bg-blue-500 rounded" />
          </div>
          <button className="mt-3 w-full bg-teal-500 text-white rounded-lg py-1">
            Participar
          </button>
          <p className="mt-2 text-center text-sm text-gray-400">Claro</p>
        </div>

        {/* Card Escuro */}
        <div
          onClick={() => setSelectedTheme("dark")}
          className={`cursor-pointer rounded-lg border p-4 shadow-sm transition ${
            selectedTheme === "dark"
              ? "border-blue-500 ring-2 ring-blue-500"
              : "border-gray-700"
          }`}
        >
          <h3 className="font-semibold text-white">Rifa do iPhone</h3>
          <p className="text-sm text-gray-400">R$ 5,00 por bilhete</p>
          <div className="mt-2 bg-gray-700 h-2 rounded">
            <div className="w-1/2 h-2 bg-blue-500 rounded" />
          </div>
          <button className="mt-3 w-full bg-teal-500 text-white rounded-lg py-1">
            Participar
          </button>
          <p className="mt-2 text-center text-sm text-gray-400">Escuro</p>
        </div>

        {/* Card Escuro Preto */}
        <div
          onClick={() => setSelectedTheme("black")}
          className={`cursor-pointer rounded-lg border p-4 shadow-sm transition ${
            selectedTheme === "black"
              ? "border-blue-500 ring-2 ring-blue-500"
              : "border-gray-700"
          }`}
        >
          <h3 className="font-semibold text-white">Rifa do iPhone</h3>
          <p className="text-sm text-gray-400">R$ 5,00 por bilhete</p>
          <div className="mt-2 bg-black h-2 rounded">
            <div className="w-1/3 h-2 bg-blue-500 rounded" />
          </div>
          <button className="mt-3 w-full bg-teal-500 text-white rounded-lg py-1">
            Participar
          </button>
          <p className="mt-2 text-center text-sm text-gray-400">Escuro Preto</p>
        </div>
      </div>
    </div>
  );
}
