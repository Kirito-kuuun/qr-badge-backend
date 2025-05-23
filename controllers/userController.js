const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { query } = require('../config/database');
const validation = require('../utils/validation');

// Contrôleur pour les utilisateurs
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validation des données
    if (!validation.isValidEmail(email)) {
      return res.status(400).json({ error: 'Email invalide' });
    }
    
    // Vérifier si l'utilisateur existe
    const user = await query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    
    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.rows[0].password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    
    // Générer un token JWT
    const token = jwt.sign(
      { id: user.rows[0].id, role: user.rows[0].role },
      process.env.JWT_SECRET || 'qr-badge-secret-key-123',
      { expiresIn: '24h' }
    );
    
    // Retourner l'utilisateur et le token
    res.status(200).json({
      success: true,
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
        role: user.rows[0].role
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await query('SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY created_at DESC');
    res.status(200).json({
      success: true,
      count: users.rows.length,
      users: users.rows
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await query('SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1', [id]);
    
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    res.status(200).json({
      success: true,
      user: user.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validation des données
    if (!validation.isValidUsername(name)) {
      return res.status(400).json({ error: 'Nom invalide' });
    }
    
    if (!validation.isValidEmail(email)) {
      return res.status(400).json({ error: 'Email invalide' });
    }
    
    if (!validation.isValidPassword(password)) {
      return res.status(400).json({ error: 'Mot de passe invalide (minimum 8 caractères)' });
    }
    
    // Vérifier si l'email existe déjà
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }
    
    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Créer l'utilisateur
    const user = await query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at, updated_at',
      [name, email, hashedPassword, role || 'user']
    );
    
    res.status(201).json({
      success: true,
      user: user.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;
    
    // Vérifier si l'utilisateur existe
    const user = await query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Validation des données
    if (name && !validation.isValidUsername(name)) {
      return res.status(400).json({ error: 'Nom invalide' });
    }
    
    if (email && !validation.isValidEmail(email)) {
      return res.status(400).json({ error: 'Email invalide' });
    }
    
    if (password && !validation.isValidPassword(password)) {
      return res.status(400).json({ error: 'Mot de passe invalide (minimum 8 caractères)' });
    }
    
    // Vérifier si l'email existe déjà
    if (email && email !== user.rows[0].email) {
      const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' });
      }
    }
    
    // Préparer les données à mettre à jour
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (name) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    
    if (email) {
      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updates.push(`password = $${paramCount}`);
      values.push(hashedPassword);
      paramCount++;
    }
    
    if (role) {
      updates.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Mettre à jour l'utilisateur
    if (updates.length > 0) {
      values.push(id);
      const updatedUser = await query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, name, email, role, created_at, updated_at`,
        values
      );
      
      res.status(200).json({
        success: true,
        user: updatedUser.rows[0]
      });
    } else {
      res.status(200).json({
        success: true,
        user: {
          id: user.rows[0].id,
          name: user.rows[0].name,
          email: user.rows[0].email,
          role: user.rows[0].role,
          created_at: user.rows[0].created_at,
          updated_at: user.rows[0].updated_at
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Vérifier si l'utilisateur existe
    const user = await query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Supprimer l'utilisateur
    await query('DELETE FROM users WHERE id = $1', [id]);
    
    res.status(200).json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    next(error);
  }
};
