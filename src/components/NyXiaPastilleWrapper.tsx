'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import NyXiaChatWidget from '@/components/nyxia-chat'

const HIDE_PASTILLE_ROUTES = ['/dashboard', '/admin', '/super-admin', '/ambassadeur']

export default function NyXiaPastilleWrapper() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const shouldHide = HIDE_PASTILLE_ROUTES.some(route => pathname.startsWith(route))
    setVisible(!shouldHide)
  }, [pathname])

  if (!visible) return null

  return <NyXiaChatWidget />
}
