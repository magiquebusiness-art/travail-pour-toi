-- =============================================
-- MISE À JOUR BASE DE DONNÉES AFFILIATIONPRO
-- Structure 3 niveaux: Super Admin > Admin > Affilié
-- =============================================

-- 1. Ajouter les colonnes manquantes à profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS paypal_email TEXT,
ADD COLUMN IF NOT EXISTS subdomain TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 2. Mettre à jour le rôle pour supporter super_admin
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'admin', 'affiliate'));

-- 3. Créer la table messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  is_broadcast BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Créer la table payouts (paiements)
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  affiliate_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  paypal_email TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Index pour optimisation
CREATE INDEX IF NOT EXISTS idx_profiles_admin_id ON profiles(admin_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_subdomain ON profiles(subdomain);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_payouts_admin ON payouts(admin_id);
CREATE INDEX IF NOT EXISTS idx_payouts_affiliate ON payouts(affiliate_id);

-- 6. Mettre à jour les politiques RLS

-- Profiles: les super_admins voient tout
CREATE POLICY "Super admins can see all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
  OR id = auth.uid()
  OR admin_id = auth.uid()
);

-- Profiles: les admins voient leurs affiliés
CREATE POLICY "Admins manage their affiliates"
ON profiles FOR ALL
TO authenticated
USING (
  id = auth.uid()
  OR admin_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
);

-- Messages: lecture
CREATE POLICY "Users can read their messages"
ON messages FOR SELECT
TO authenticated
USING (
  sender_id = auth.uid()
  OR recipient_id = auth.uid()
  OR (is_broadcast = TRUE AND EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid()
  ))
  OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
);

-- Messages: écriture (super admin peut tout créer)
CREATE POLICY "Super admin can send messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
);

-- Payouts: lecture
CREATE POLICY "Users can see their payouts"
ON payouts FOR SELECT
TO authenticated
USING (
  admin_id = auth.uid()
  OR affiliate_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
);

-- Payouts: création (admins paient leurs affiliés)
CREATE POLICY "Admins create payouts"
ON payouts FOR INSERT
TO authenticated
WITH CHECK (
  admin_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
);

-- 7. Créer le compte Super Admin (Diane)
-- Note: L'utilisateur doit d'abord être créé via l'API, puis on update le rôle
-- UPDATE profiles SET role = 'super_admin' WHERE email = 'dianeboyer@affiliationpro.publication-web.com';

-- 8. Fonction pour obtenir les stats globales (Super Admin)
CREATE OR REPLACE FUNCTION get_global_stats()
RETURNS JSON
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'total_admins', (SELECT COUNT(*) FROM profiles WHERE role = 'admin'),
    'total_affiliates', (SELECT COUNT(*) FROM profiles WHERE role = 'affiliate'),
    'total_sales', (SELECT COUNT(*) FROM sales),
    'total_revenue', (SELECT COALESCE(SUM(amount), 0) FROM sales),
    'pending_payouts', (SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE status = 'pending'),
    'total_payouts', (SELECT COALESCE(SUM(amount), 0) FROM payouts WHERE status = 'paid')
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Fonction pour obtenir les stats d'un admin
CREATE OR REPLACE FUNCTION get_admin_stats(admin_uuid UUID)
RETURNS JSON
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_affiliates', (SELECT COUNT(*) FROM profiles WHERE admin_id = admin_uuid),
    'total_sales', (SELECT COUNT(*) FROM sales s 
      JOIN affiliates a ON s.affiliate_id = a.id 
      WHERE a.user_id IN (SELECT id FROM profiles WHERE admin_id = admin_uuid)),
    'total_revenue', (SELECT COALESCE(SUM(s.amount), 0) FROM sales s
      JOIN affiliates a ON s.affiliate_id = a.id 
      WHERE a.user_id IN (SELECT id FROM profiles WHERE admin_id = admin_uuid)),
    'pending_payouts', (SELECT COALESCE(SUM(c.amount), 0) FROM commissions c
      JOIN affiliates a ON c.affiliate_id = a.id 
      WHERE a.user_id IN (SELECT id FROM profiles WHERE admin_id = admin_uuid) AND c.status = 'pending')
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
