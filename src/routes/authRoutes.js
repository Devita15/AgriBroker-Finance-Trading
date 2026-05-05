// src/routes/authRoutes.js
const express    = require('express');
const router     = express.Router();
const auth       = require('../controllers/authController');
const authenticate = require('../middleware/auth');
const { validateUserRegistration, validateLogin, validateRefreshToken } = require('../middleware/validation');
const auditLog   = require('../middleware/auditLogger');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and profile management APIs
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Authentication]
 *     description: Create a new user account with email and password
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Rajesh Sharma"
 *                 description: Full name of the user
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "rajesh@example.com"
 *                 description: Valid email address
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "password123"
 *                 description: Password (minimum 6 characters)
 *               role:
 *                 type: string
 *                 enum: [superadmin, operator]
 *                 default: operator
 *                 example: "operator"
 *                 description: User role (superadmin or operator)
 *               phone:
 *                 type: string
 *                 example: "+91 98765 43210"
 *                 description: Contact phone number
 *               businessName:
 *                 type: string
 *                 example: "Sharma Farms"
 *                 description: Business or farm name
 *               address:
 *                 type: string
 *                 example: "123 Farm Road, Green Valley"
 *                 description: Physical address
 *               city:
 *                 type: string
 *                 example: "Mumbai"
 *                 description: City
 *               state:
 *                 type: string
 *                 example: "Maharashtra"
 *                 description: State
 *               gstNumber:
 *                 type: string
 *                 example: "27AAAAA0000A1Z"
 *                 description: GST number (if applicable)
 *               panNumber:
 *                 type: string
 *                 example: "ABCDE1234F"
 *                 description: PAN card number
 *               bankAccountNumber:
 *                 type: string
 *                 example: "12345678901234"
 *                 description: Bank account number
 *               ifscCode:
 *                 type: string
 *                 example: "SBIN0001234"
 *                 description: IFSC code for bank
 *               bankName:
 *                 type: string
 *                 example: "State Bank of India"
 *                 description: Bank name
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User registered successfully"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token (expires in 15 minutes)
 *                 refreshToken:
 *                   type: string
 *                   description: JWT refresh token (expires in 7 days)
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.post('/register', validateUserRegistration, auditLog('REGISTER', 'User'), auth.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login to your account
 *     tags: [Authentication]
 *     description: Authenticate user and receive access and refresh tokens
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "rajesh@example.com"
 *                 description: Registered email address
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *                 description: Account password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     businessName:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                 accessToken:
 *                   type: string
 *                   description: Use this token for authenticated requests (Bearer token)
 *                 refreshToken:
 *                   type: string
 *                   description: Use this token to get new access tokens
 *       401:
 *         description: Invalid credentials or account deactivated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.post('/login', validateLogin, auditLog('LOGIN', 'User'), auth.login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     description: Get a new access token using your refresh token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 description: Your refresh token from login
 *     responses:
 *       200:
 *         description: New tokens issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 accessToken:
 *                   type: string
 *                   description: New access token
 *                 refreshToken:
 *                   type: string
 *                   description: New refresh token
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 */
router.post('/refresh', validateRefreshToken, auth.refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout from current session
 *     tags: [Authentication]
 *     description: Invalidate your refresh token and logout
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Logged out successfully"
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.post('/logout', authenticate, auditLog('LOGOUT', 'User'), auth.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     description: Retrieve your profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     businessName:
 *                       type: string
 *                     address:
 *                       type: string
 *                     city:
 *                       type: string
 *                     state:
 *                       type: string
 *                     gstNumber:
 *                       type: string
 *                     panNumber:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 */
router.get('/me', authenticate, auth.getMe);

/**
 * @swagger
 * /api/auth/me:
 *   put:
 *     summary: Update current user profile
 *     tags: [Authentication]
 *     description: Update your profile information (all fields optional)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Rajesh Kumar Sharma"
 *               phone:
 *                 type: string
 *                 example: "+91 98765 43211"
 *               businessName:
 *                 type: string
 *                 example: "Sharma Organic Farms"
 *               address:
 *                 type: string
 *                 example: "456 New Farm Road"
 *               city:
 *                 type: string
 *                 example: "Pune"
 *               state:
 *                 type: string
 *                 example: "Maharashtra"
 *               gstNumber:
 *                 type: string
 *                 example: "27BBBBB0000B2Z"
 *               panNumber:
 *                 type: string
 *                 example: "FGHIJ5678K"
 *               bankAccountNumber:
 *                 type: string
 *                 example: "98765432109876"
 *               ifscCode:
 *                 type: string
 *                 example: "HDFC0005678"
 *               bankName:
 *                 type: string
 *                 example: "HDFC Bank"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 user:
 *                   type: object
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 */
router.put('/me', authenticate, auth.updateProfile);

module.exports = router;