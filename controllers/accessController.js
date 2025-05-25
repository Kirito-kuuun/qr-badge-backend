const { query } = require('../config/database');

// Contrôleur pour les accès
exports.getAllAccesses = async (req, res, next) => {
  try {
    const accesses = await query(`
      SELECT a.*, b.qr_code, b.name, b.device_brand, b.device_model 
      FROM accesses a
      JOIN badges b ON a.badge_id = b.id
      ORDER BY a.created_at DESC
    `);
    
    res.status(200).json({
      success: true,
      count: accesses.rows.length,
      accesses: accesses.rows
    });
  } catch (error) {
    next(error);
  }
};

exports.getAccessesByBadge = async (req, res, next) => {
  try {
    const { badgeId } = req.params;
    
    // Vérifier si le badge existe
    const badge = await query('SELECT * FROM badges WHERE id = $1', [badgeId]);
    
    if (badge.rows.length === 0) {
      return res.status(404).json({ error: 'Badge non trouvé' });
    }
    
    // Récupérer les accès du badge
    const accesses = await query('SELECT * FROM accesses WHERE badge_id = $1 ORDER BY created_at DESC', [badgeId]);
    
    res.status(200).json({
      success: true,
      count: accesses.rows.length,
      badge: badge.rows[0],
      accesses: accesses.rows
    });
  } catch (error) {
    next(error);
  }
};

exports.getAccessStats = async (req, res, next) => {
  try {
    // Statistiques par jour
    const dailyStats = await query(`
      SELECT 
        DATE(created_at) as date, 
        COUNT(*) as count 
      FROM accesses 
      GROUP BY DATE(created_at) 
      ORDER BY date DESC
    `);
    
    // Statistiques par appareil
    const deviceStats = await query(`
      SELECT 
        b.device_brand, 
        COUNT(*) as count 
      FROM accesses a
      JOIN badges b ON a.badge_id = b.id
      GROUP BY b.device_brand 
      ORDER BY count DESC
    `);
    
    // Nombre total d'accès
    const totalAccesses = await query('SELECT COUNT(*) as count FROM accesses');
    
    // Nombre total de badges uniques
    const uniqueBadges = await query('SELECT COUNT(DISTINCT badge_id) as count FROM accesses');
    
    res.status(200).json({
      success: true,
      stats: {
        total: parseInt(totalAccesses.rows[0].count),
        uniqueBadges: parseInt(uniqueBadges.rows[0].count),
        daily: dailyStats.rows,
        devices: deviceStats.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Vérifier si l'accès existe
    const access = await query('SELECT * FROM accesses WHERE id = $1', [id]);
    
    if (access.rows.length === 0) {
      return res.status(404).json({ error: 'Accès non trouvé' });
    }
    
    // Supprimer l'accès
    await query('DELETE FROM accesses WHERE id = $1', [id]);
    
    res.status(200).json({
      success: true,
      message: 'Accès supprimé avec succès'
    });
  } catch (error) {
    next(error);
  }
};
