-- Script d'initialisation des tables pour Supabase
-- QR Badge App - CREDIT: KIRITO

-- Table des utilisateurs administrateurs
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des badges
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100),
  device_brand VARCHAR(100),
  device_model VARCHAR(100),
  validation_time TIMESTAMP WITH TIME ZONE,
  -- Date d'expiration fixée au 16 juin 2025 à 17h (heure de Madagascar, UTC+3)
  expiration_time TIMESTAMP WITH TIME ZONE DEFAULT '2025-06-16T14:00:00Z',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des accès
CREATE TABLE IF NOT EXISTS accesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_id UUID REFERENCES badges(id),
  access_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(50),
  user_agent TEXT
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_badges_qr_code ON badges(qr_code);
CREATE INDEX IF NOT EXISTS idx_accesses_badge_id ON accesses(badge_id);
CREATE INDEX IF NOT EXISTS idx_accesses_access_time ON accesses(access_time);

-- Création d'un utilisateur admin par défaut
-- Mot de passe: admin123 (à changer après la première connexion)
INSERT INTO users (username, email, password, role)
VALUES (
  'admin', 
  'admin@example.com', 
  '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG3vv1BD7WC', 
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- Fonction pour mettre à jour le timestamp "updated_at"
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mettre à jour automatiquement "updated_at"
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_badges_updated_at
BEFORE UPDATE ON badges
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Commentaires sur les tables
COMMENT ON TABLE users IS 'Utilisateurs administrateurs de l''application QR Badge';
COMMENT ON TABLE badges IS 'Badges QR pour l''événement du 16 juin 2025';
COMMENT ON TABLE accesses IS 'Historique des accès aux badges QR';
