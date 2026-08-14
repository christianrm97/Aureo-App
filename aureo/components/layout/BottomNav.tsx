'use client'

import Link from 'next/link'
import { Home, PieChart, BarChart2, List } from 'lucide-react'

const tabs = [
  { href: '/dashboard',    icon: Home,     label: 'Inicio'     },
  { href: '/gastos',       icon: PieChart, label: 'Gastos'     },
  { href: '/patrimonio',   icon: BarChart2,label: 'Patrimonio' },
  { href: '/proyeccion',   icon: List,     label: 'Proyección' },
]

export default function BottomNav({ activo }: { activo: string }) {
  return (
    <nav className="tabbar fixed bottom-0 inset-x-0 safe-bottom z-20">
      <div className="flex items-center justify-around py-2 px-2">
        {/* Vacío en el centro para el botón + */}
        {tabs.map((tab, i) => {
          const isActivo = activo === tab.href.slice(1)
          const Icon = tab.icon

          // Dejar hueco en el medio (posición 2 de 4 tabs)
          if (i === 2) {
            return (
              <div key="gap" className="flex flex-col items-center gap-0.5 w-14">
                <div className="w-5 h-5" />
              </div>
            )
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
                isActivo ? 'text-aureo-green' : 'text-aureo-muted'
              }`}
            >
              <Icon size={22} strokeWidth={isActivo ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
