/**
 * Utilitaires de validation pour l'application QR Badge
 */

// Valider un QR code
exports.isValidQrCode = (qrCode) => {
  if (!qrCode || typeof qrCode !== 'string') {
    return false;
  }
  
  // Un QR code valide doit avoir entre 5 et 100 caractères
  return qrCode.length >= 5 && qrCode.length <= 100;
};

// Obtenir la date d'expiration par défaut (16 juin 2025 à 17h, heure de Madagascar)
exports.getDefaultExpirationDate = () => {
  // 16 juin 2025 à 17h00 heure de Madagascar (UTC+3)
  // En UTC, cela correspond à 14h00
  return new Date('2025-06-16T14:00:00Z');
};

// Valider une date d'expiration
exports.isValidExpirationDate = (date) => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return false;
  }
  
  const now = new Date();
  const maxDate = new Date('2025-06-16T14:00:00Z'); // Date limite maximale
  
  // La date doit être dans le futur et ne pas dépasser la date limite
  return date > now && date <= maxDate;
};

// Valider un nom d'utilisateur
exports.isValidUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return false;
  }
  
  // Un nom d'utilisateur valide doit avoir entre 3 et 50 caractères
  return username.length >= 3 && username.length <= 50;
};

// Valider un mot de passe
exports.isValidPassword = (password) => {
  if (!password || typeof password !== 'string') {
    return false;
  }
  
  // Un mot de passe valide doit avoir au moins 8 caractères
  return password.length >= 8;
};

// Valider un email
exports.isValidEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // Expression régulière pour valider un email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Valider une marque d'appareil
exports.isValidDeviceBrand = (brand) => {
  if (!brand || typeof brand !== 'string') {
    return false;
  }
  
  // Une marque valide doit avoir entre 1 et 50 caractères
  return brand.length >= 1 && brand.length <= 50;
};

// Valider un modèle d'appareil
exports.isValidDeviceModel = (model) => {
  if (!model || typeof model !== 'string') {
    return false;
  }
  
  // Un modèle valide doit avoir entre 1 et 100 caractères
  return model.length >= 1 && model.length <= 100;
};
