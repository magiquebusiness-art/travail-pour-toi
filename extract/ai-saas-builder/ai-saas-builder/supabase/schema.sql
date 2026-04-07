-- =====================================================
-- AffiliationPro - Complete Database Schema
-- 3-Level Affiliate Commission System
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- 1. PROFILES - Extension of auth.users
-- Stores user data with affiliate code for referral links
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'affiliate' CHECK (role IN ('admin', 'affiliate')),
  affiliate_code TEXT UNIQUE NOT NULL DEFAULT UPPER(SUBSTRING(REPLACE(UUID_GENERATE_V4()::TEXT, '-', ''), 1, 8)),
  parent_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Direct parent in 3-level system
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROGRAMS - Affiliate programs
-- Each program has its own commission rates
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT UUID_GENERATE_V4(),
  name TEXT NOT NULL,
  description TEXT,
  commission_l1 DECIMAL(5, 2) DEFAULT 25.00, -- Level 1 commission (direct)
  commission_l2 DECIMAL(5, 2) DEFAULT 10.00, -- Level 2 commission (parent)
  commission_l3 DECIMAL(5, 2) DEFAULT 5.00,  -- Level 3 commission (grandparent)
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AFFILIATES - Program subscriptions
-- Links users to programs with their unique affiliate links
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT UUID_GENERATE_V4(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  affiliate_link TEXT UNIQUE NOT NULL DEFAULT UPPER(SUBSTRING(REPLACE(UUID_GENERATE_V4()::TEXT, '-', ''), 1, 10)),
  parent_affiliate_id UUID REFERENCES affiliates(id) ON DELETE SET NULL, -- Level 1 up
  grandparent_affiliate_id UUID REFERENCES affiliates(id) ON DELETE SET NULL, -- Level 2 up
  total_earnings DECIMAL(12, 2) DEFAULT 0.00,
  total_referrals INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'paused')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_id, user_id)
);

-- 4. SALES - Tracked sales/transactions
-- Records each sale with 3-level commission breakdown
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT UUID_GENERATE_V4(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  external_order_id TEXT, -- ID from Systeme.io or other platform
  amount DECIMAL(12, 2) NOT NULL, -- Sale amount
  commission_l1 DECIMAL(12, 2) DEFAULT 0.00, -- Commission for direct affiliate
  commission_l2 DECIMAL(12, 2) DEFAULT 0.00, -- Commission for parent
  commission_l3 DECIMAL(12, 2) DEFAULT 0.00, -- Commission for grandparent
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  customer_email TEXT,
  customer_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- 5. COMMISSIONS - Individual commission records
-- One record per commission per sale (3 records per sale max)
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT UUID_GENERATE_V4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
  amount DECIMAL(12, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PAYOUTS - Affiliate payment withdrawals
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT UUID_GENERATE_V4(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payment_method TEXT NOT NULL, -- 'paypal', 'bank_transfer', 'stripe', etc.
  payment_details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- 7. CLICKS - Referral link click tracking
CREATE TABLE IF NOT EXISTS clicks (
  id UUID PRIMARY KEY DEFAULT UUID_GENERATE_V4(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  visitor_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referrer_url TEXT,
  landing_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_affiliate_code ON profiles(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_profiles_parent_id ON profiles(parent_id);

-- Programs indexes
CREATE INDEX IF NOT EXISTS idx_programs_owner_id ON programs(owner_id);
CREATE INDEX IF NOT EXISTS idx_programs_is_active ON programs(is_active);

-- Affiliates indexes
CREATE INDEX IF NOT EXISTS idx_affiliates_program_id ON affiliates(program_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_affiliate_link ON affiliates(affiliate_link);
CREATE INDEX IF NOT EXISTS idx_affiliates_parent_affiliate_id ON affiliates(parent_affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_grandparent_affiliate_id ON affiliates(grandparent_affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON affiliates(status);

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_affiliate_id ON sales(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_sales_program_id ON sales(program_id);
CREATE INDEX IF NOT EXISTS idx_sales_external_order_id ON sales(external_order_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);

-- Commissions indexes
CREATE INDEX IF NOT EXISTS idx_commissions_sale_id ON commissions(sale_id);
CREATE INDEX IF NOT EXISTS idx_commissions_affiliate_id ON commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_level ON commissions(level);

-- Payouts indexes
CREATE INDEX IF NOT EXISTS idx_payouts_affiliate_id ON payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_created_at ON payouts(created_at);

-- Clicks indexes
CREATE INDEX IF NOT EXISTS idx_clicks_affiliate_id ON clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_clicks_created_at ON clicks(created_at);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles.updated_at
DROP TRIGGER IF EXISTS on_profiles_updated ON profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to auto-create profile on auth.users creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to handle referral link parent assignment
-- When an affiliate is created, find parent and grandparent from profile hierarchy
CREATE OR REPLACE FUNCTION assign_affiliate_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
  parent_profile_id UUID;
  grandparent_profile_id UUID;
  parent_affiliate UUID;
  grandparent_affiliate UUID;
BEGIN
  -- Only run on insert and when parent_affiliate_id is null
  IF TG_OP = 'INSERT' AND NEW.parent_affiliate_id IS NULL THEN
    -- Get user's parent from profiles
    SELECT parent_id INTO parent_profile_id
    FROM profiles WHERE id = NEW.user_id;
    
    IF parent_profile_id IS NOT NULL THEN
      -- Get parent's affiliate record for this program
      SELECT id INTO parent_affiliate
      FROM affiliates
      WHERE user_id = parent_profile_id AND program_id = NEW.program_id;
      
      IF parent_affiliate IS NOT NULL THEN
        NEW.parent_affiliate_id := parent_affiliate;
        
        -- Get grandparent
        SELECT grandparent_affiliate_id INTO grandparent_affiliate
        FROM affiliates WHERE id = parent_affiliate;
        
        IF grandparent_affiliate IS NOT NULL THEN
          NEW.grandparent_affiliate_id := grandparent_affiliate;
        ELSE
          -- Try to get grandparent from profile hierarchy
          SELECT parent_id INTO grandparent_profile_id
          FROM profiles WHERE id = parent_profile_id;
          
          IF grandparent_profile_id IS NOT NULL THEN
            SELECT id INTO grandparent_affiliate
            FROM affiliates
            WHERE user_id = grandparent_profile_id AND program_id = NEW.program_id;
            
            IF grandparent_affiliate IS NOT NULL THEN
              NEW.grandparent_affiliate_id := grandparent_affiliate;
            END IF;
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for affiliate hierarchy
DROP TRIGGER IF EXISTS on_affiliate_hierarchy ON affiliates;
CREATE TRIGGER on_affiliate_hierarchy
  BEFORE INSERT ON affiliates
  FOR EACH ROW
  EXECUTE FUNCTION assign_affiliate_hierarchy();

-- Function to increment referral count
CREATE OR REPLACE FUNCTION increment_referral_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_affiliate_id IS NOT NULL THEN
    UPDATE affiliates
    SET total_referrals = total_referrals + 1
    WHERE id = NEW.parent_affiliate_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for referral count
DROP TRIGGER IF EXISTS on_affiliate_created ON affiliates;
CREATE TRIGGER on_affiliate_created
  AFTER INSERT ON affiliates
  FOR EACH ROW
  EXECUTE FUNCTION increment_referral_count();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES RLS POLICIES
-- =====================================================

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow insert during signup (trigger handles this)
CREATE POLICY "Allow profile insert via trigger" ON profiles
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- PROGRAMS RLS POLICIES
-- =====================================================

CREATE POLICY "Anyone can view active programs" ON programs
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their own programs" ON programs
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Admins can view all programs" ON programs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create programs" ON programs
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Program owners can update" ON programs
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Admins can update all programs" ON programs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- AFFILIATES RLS POLICIES
-- =====================================================

CREATE POLICY "Users can view own affiliates" ON affiliates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view affiliates where they are parent" ON affiliates
  FOR SELECT USING (
    parent_affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all affiliates" ON affiliates
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create own affiliate" ON affiliates
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own affiliate" ON affiliates
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can update all affiliates" ON affiliates
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- SALES RLS POLICIES
-- =====================================================

CREATE POLICY "Users can view own sales" ON sales
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all sales" ON sales
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Service role can insert sales" ON sales
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update sales" ON sales
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- COMMISSIONS RLS POLICIES
-- =====================================================

CREATE POLICY "Users can view own commissions" ON commissions
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all commissions" ON commissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Service role can insert commissions" ON commissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update commissions" ON commissions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- PAYOUTS RLS POLICIES
-- =====================================================

CREATE POLICY "Users can view own payouts" ON payouts
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all payouts" ON payouts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create own payouts" ON payouts
  FOR INSERT WITH CHECK (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can update all payouts" ON payouts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- CLICKS RLS POLICIES
-- =====================================================

CREATE POLICY "Users can view own clicks" ON clicks
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all clicks" ON clicks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Allow public click tracking" ON clicks
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to get full affiliate tree (for admin)
CREATE OR REPLACE FUNCTION get_affiliate_tree(affiliate_uuid UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  full_name TEXT,
  level INTEGER,
  total_earnings DECIMAL,
  total_referrals INTEGER
) AS $$
WITH RECURSIVE affiliate_tree AS (
  -- Base case: the starting affiliate
  SELECT 
    a.id,
    a.user_id,
    p.email,
    p.full_name,
    0 as level,
    a.total_earnings,
    a.total_referrals
  FROM affiliates a
  JOIN profiles p ON a.user_id = p.id
  WHERE a.id = affiliate_uuid
  
  UNION ALL
  
  -- Recursive case: direct referrals
  SELECT 
    child.id,
    child.user_id,
    p.email,
    p.full_name,
    tree.level + 1,
    child.total_earnings,
    child.total_referrals
  FROM affiliates child
  JOIN profiles p ON child.user_id = p.id
  JOIN affiliate_tree tree ON child.parent_affiliate_id = tree.id
  WHERE tree.level < 5 -- Limit depth to prevent infinite loops
)
SELECT * FROM affiliate_tree ORDER BY level;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate pending commissions for an affiliate
CREATE OR REPLACE FUNCTION get_pending_commissions(affiliate_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  total DECIMAL;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total
  FROM commissions
  WHERE affiliate_id = affiliate_uuid AND status = 'pending';
  
  RETURN total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VIEWS FOR DASHBOARD
-- =====================================================

-- View for affiliate dashboard stats
CREATE OR REPLACE VIEW affiliate_stats AS
SELECT 
  a.id as affiliate_id,
  a.user_id,
  a.program_id,
  p.name as program_name,
  a.total_earnings,
  a.total_referrals,
  COALESCE(SUM(CASE WHEN c.status = 'pending' THEN c.amount ELSE 0 END), 0) as pending_commissions,
  COALESCE(COUNT(DISTINCT s.id), 0) as total_sales,
  COALESCE(COUNT(DISTINCT cl.id), 0) as total_clicks,
  a.created_at
FROM affiliates a
LEFT JOIN programs p ON a.program_id = p.id
LEFT JOIN commissions c ON a.id = c.affiliate_id
LEFT JOIN sales s ON a.id = s.affiliate_id
LEFT JOIN clicks cl ON a.id = cl.affiliate_id
GROUP BY a.id, a.user_id, a.program_id, p.name, a.total_earnings, a.total_referrals, a.created_at;

-- =====================================================
-- INITIAL DATA (Optional - for testing)
-- =====================================================

-- Insert a default program (will be owned by first admin user)
-- This should be run after creating an admin user

-- Example:
-- INSERT INTO programs (name, description, commission_l1, commission_l2, commission_l3, owner_id)
-- VALUES ('AffiliationPro Default', 'Programme d''affiliation par défaut', 25.00, 10.00, 5.00, '<admin_user_id>');
