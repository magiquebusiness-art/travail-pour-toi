// D1 Database Types for Frontend

export interface User {
  id: string
  email: string
  password_hash?: string
  full_name: string | null
  avatar_url: string | null
  role: 'super_admin' | 'admin' | 'affiliate'
  affiliate_code: string
  parent_id: string | null
  paypal_email: string | null
  subdomain: string | null
  admin_id: string | null
  created_at: string
  updated_at: string
}

// Profile alias for backward compatibility
export type Profile = User

export interface Program {
  id: string
  name: string
  description: string | null
  commission_l1: number
  commission_l2: number
  commission_l3: number
  owner_id: string
  is_active: number
  created_at: string
}

export interface Affiliate {
  id: string
  program_id: string
  user_id: string
  affiliate_link: string
  parent_affiliate_id: string | null
  grandparent_affiliate_id: string | null
  total_earnings: number
  total_referrals: number
  status: 'active' | 'pending' | 'paused'
  created_at: string
  // Joined fields
  program_name?: string
  commission_l1?: number
  commission_l2?: number
  commission_l3?: number
}

export interface Sale {
  id: string
  affiliate_id: string
  program_id: string
  external_order_id: string | null
  amount: number
  commission_l1: number
  commission_l2: number
  commission_l3: number
  status: 'pending' | 'paid' | 'cancelled' | 'refunded'
  customer_email: string | null
  customer_name: string | null
  metadata: string
  created_at: string
  paid_at: string | null
}

export interface Commission {
  id: string
  sale_id: string
  affiliate_id: string
  level: 1 | 2 | 3
  amount: number
  status: 'pending' | 'paid' | 'cancelled'
  paid_at: string | null
  created_at: string
}

export interface Payout {
  id: string
  admin_id: string
  affiliate_id: string
  amount: number
  status: 'pending' | 'paid' | 'failed'
  paypal_email: string | null
  created_at: string
  paid_at: string | null
}

export interface Click {
  id: string
  affiliate_id: string
  visitor_id: string | null
  ip_address: string | null
  user_agent: string | null
  referrer_url: string | null
  landing_url: string | null
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  recipient_id: string | null
  subject: string
  content: string
  is_broadcast: number
  read_at: string | null
  created_at: string
}
