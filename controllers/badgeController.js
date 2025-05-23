const { query } = require('../config/database');
const validation = require('../utils/validation');

// Contrôleur pour les badges
exports.validateQrCode = async (req, res, next) => {
  try {
    const { qrCode, name, deviceBrand, deviceModel } = req.body;
    
    // Validation des données
    if (!validation.isValidQrCode(qrCode)) {
      return res.status(400).json({ error: 'QR code invalide' });
    }
    
    // Définir une date d'expiration par défaut (16 juin 2025 à 17h, heure de Madagascar)
    const defaultExpirationDate = validation.getDefaultExpirationDate();
    
    // Vérifier si le badge existe déjà
    let badge = await query('SELECT * FROM badges WHERE qr_code = $1', [qrCode]);
    
    const now = new Date();
    
    if (badge.rows.length === 0) {
      // Créer un nouveau badge
      badge = await query(
        'INSERT INTO badges (qr_code, name, device_brand, device_model, validation_time, expiration_time) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [qrCode, name || null, deviceBrand, deviceModel, now, defaultExpirationDate]
      );
    } else {
      // Mettre à jour le badge existant
      badge = await query(
        'UPDATE badges SET name = COALESCE($1, name), device_brand = $2, device_model = $3, validation_time = $4 WHERE qr_code = $5 RETURNING *',
        [name, deviceBrand, deviceModel, now, qrCode]
      );
    }
    
    // Enregistrer l'accès
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    await query(
      'INSERT INTO accesses (badge_id, ip_address, user_agent) VALUES ($1, $2, $3)',
      [badge.rows[0].id, ip, userAgent]
    );
    
    // Retourner le badge
    res.status(200).json({
      success: true,
      badge: badge.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.checkQrCode = async (req, res, next) => {
  try {
    const { qrCode } = req.params;
    
    // Validation des données
    if (!validation.isValidQrCode(qrCode)) {
      return res.status(400).json({ error: 'QR code invalide' });
    }
    
    // Vérifier si le badge existe
    const badge = await query('SELECT * FROM badges WHERE qr_code = $1', [qrCode]);
    
    if (badge.rows.length === 0) {
      return res.status(404).json({ error: 'Badge non trouvé' });
    }
    
    // Vérifier si le badge est actif
    if (!badge.rows[0].is_active) {
      return res.status(403).json({ error: 'Badge inactif' });
    }
    
    // Vérifier si le badge n'est pas expiré
    const now = new Date();
    const expirationTime = new Date(badge.rows[0].expiration_time);
    
    if (now > expirationTime) {
      return res.status(403).json({ error: 'Badge expiré' });
    }
    
    // Retourner le badge
    res.status(200).json({
      success: true,
      badge: badge.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllBadges = async (req, res, next) => {
  try {
    const badges = await query('SELECT * FROM badges ORDER BY created_at DESC');
    res.status(200).json({
      success: true,
      count: badges.rows.length,
      badges: badges.rows
    });
  } catch (error) {
    next(error);
  }
};

exports.getBadgeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const badge = await query('SELECT * FROM badges WHERE id = $1', [id]);
    
    if (badge.rows.length === 0) {
      return res.status(404).json({ error: 'Badge non trouvé' });
    }
    
    res.status(200).json({
      success: true,
      badge: badge.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.createBadge = async (req, res, next) => {
  try {
    const { qrCode, name, deviceBrand, deviceModel, expirationTime } = req.body;
    
    // Validation des données
    if (!validation.isValidQrCode(qrCode)) {
      return res.status(400).json({ error: 'QR code invalide' });
    }
    
    // Vérifier si le badge existe déjà
    const existingBadge = await query('SELECT * FROM badges WHERE qr_code = $1', [qrCode]);
    
    if (existingBadge.rows.length > 0) {
      return res.status(400).json({ error: 'Ce QR code existe déjà' });
    }
    
    // Définir une date d'expiration par défaut si non fournie
    let expiration = expirationTime ? new Date(expirationTime) : validation.getDefaultExpirationDate();
    
    // Valider la date d'expiration
    if (!validation.isValidExpirationDate(expiration)) {
      expiration = validation.getDefaultExpirationDate();
    }
    
    // Créer le badge
    const badge = await query(
      'INSERT INTO badges (qr_code, name, device_brand, device_model, expiration_time) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [qrCode, name || null, deviceBrand || null, deviceModel || null, expiration]
    );
    
    res.status(201).json({
      success: true,
      badge: badge.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.updateBadge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, deviceBrand, deviceModel, expirationTime, isActive } = req.body;
    
    // Vérifier si le badge existe
    const badge = await query('SELECT * FROM badges WHERE id = $1', [id]);
    
    if (badge.rows.length === 0) {
      return res.status(404).json({ error: 'Badge non trouvé' });
    }
    
    // Valider la date d'expiration si fournie
    let expiration = badge.rows[0].expiration_time;
    if (expirationTime) {
      const newExpiration = new Date(expirationTime);
      if (validation.isValidExpirationDate(newExpiration)) {
        expiration = newExpiration;
      }
    }
    
    // Mettre à jour le badge
    const updatedBadge = await query(
      'UPDATE badges SET name = COALESCE($1, name), device_brand = COALESCE($2, device_brand), device_model = COALESCE($3, device_model), expiration_time = $4, is_active = COALESCE($5, is_active), updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [name, deviceBrand, deviceModel, expiration, isActive, id]
    );
    
    res.status(200).json({
      success: true,
      badge: updatedBadge.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteBadge = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Vérifier si le badge existe
    const badge = await query('SELECT * FROM badges WHERE id = $1', [id]);
    
    if (badge.rows.length === 0) {
      return res.status(404).json({ error: 'Badge non trouvé' });
    }
    
    // Supprimer les accès associés
    await query('DELETE FROM accesses WHERE badge_id = $1', [id]);
    
    // Supprimer le badge
    await query('DELETE FROM badges WHERE id = $1', [id]);
    
    res.status(200).json({
      success: true,
      message: 'Badge supprimé avec succès'
    });
  } catch (error) {
    next(error);
  }
};

exports.closeEvent = async (req, res, next) => {
  try {
    // Désactiver tous les badges
    await query('UPDATE badges SET is_active = false, updated_at = CURRENT_TIMESTAMP');
    
    res.status(200).json({
      success: true,
      message: 'Tous les badges ont été désactivés'
    });
  } catch (error) {
    next(error);
  }
};
