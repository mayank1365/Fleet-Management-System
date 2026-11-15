const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { getStore } = require('../db/store');
const { authenticateJWT, authorizeRoles } = require('../middleware/jwtAuth');

const router = express.Router();

/**
 * POST /api/users/register
 * Register a new fleet user (admin, driver, viewer)
 */
router.post('/register', (req, res) => {
  const { name, email, password, role = 'driver', phone = '+919800000000' } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: 'Fields "name", "email", and "password" are required.'
    });
  }

  const validRoles = ['admin', 'driver', 'viewer'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: `Invalid role '${role}'. Allowed roles: ${validRoles.join(', ')}.`
    });
  }

  const store = getStore();
  const existing = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({
      success: false,
      error: 'ConflictError',
      message: `User with email '${email}' already exists.`
    });
  }

  const newUser = {
    id: `usr-${role}-${Date.now()}`,
    name,
    email: email.toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 8),
    role,
    phone,
    createdAt: new Date().toISOString()
  };

  store.users.push(newUser);

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );

  return res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone
      },
      token
    }
  });
});

/**
 * POST /api/users/login
 * Authenticate user credentials and return a JWT token
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: 'Both "email" and "password" are required.'
    });
  }

  const store = getStore();
  const user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({
      success: false,
      error: 'InvalidCredentialsError',
      message: 'Invalid email or password.'
    });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    }
  });
});

/**
 * GET /api/users/verify
 * Verify JWT token and return decoded user payload
 */
router.get('/verify', authenticateJWT, (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'JWT token is valid',
    data: {
      authenticated: true,
      user: req.user
    }
  });
});

/**
 * GET /api/users/profile
 * Retrieve current authenticated user profile
 */
router.get('/profile', authenticateJWT, (req, res) => {
  const store = getStore();
  const user = store.users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'NotFoundError',
      message: 'User profile not found'
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      createdAt: user.createdAt
    }
  });
});

/**
 * GET /api/users
 * Admin-only endpoint to list all registered fleet users
 */
router.get('/', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  const store = getStore();
  const sanitized = store.users.map(({ passwordHash, ...rest }) => rest);
  return res.status(200).json({
    success: true,
    count: sanitized.length,
    data: sanitized
  });
});

module.exports = router;
