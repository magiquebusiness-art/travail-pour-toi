-- Ajout des nouvelles catégories dans la base D1
-- À exécuter via: npx wrangler d1 execute travail-pour-toi-db --remote --file=add-categories.sql

INSERT OR IGNORE INTO marketplace_categories (name, slug, icon, sort_order) VALUES
  ('Coach', 'coach', '🏋️', 2),
  ('Spiritualité', 'spiritualite', '✨', 8),
  ('Auteur', 'auteur', '📖', 9);
