const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/auth');
const { 
  validateUserRegistration, 
  validateLogin, 
  validateRefreshToken 
} = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and profile management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: "Rajesh Sharma"
 *           description: Full name of the user
 *         email:
 *           type: string
 *           format: email
 *           example: "rajesh@example.com"
 *           description: Valid email address
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *           maxLength: 50
 *           example: "password123"
 *           description: Account password (minimum 6 characters)
 *         role:
 *           type: string
 *           enum: [superadmin, operator]
 *           default: operator
 *           example: "operator"
 *           description: User role assignment
 *         phone:
 *           type: string
 *           example: "+91 98765 43210"
 *           description: Phone number with country code (optional)
 *         businessName:
 *           type: string
 *           example: "Master Dealer"
 *           description: Business or trading name (optional)
 *         address:
 *           type: string
 *           example: "123, Market Yard, Pune, Maharashtra - 411001"
 *           description: Complete address (optional)
 *         city:
 *           type: string
 *           example: "Pune"
 *           description: City (optional)
 *         state:
 *           type: string
 *           example: "Maharashtra"
 *           description: State (optional)
 *         gstNumber:
 *           type: string
 *           example: "27AAAAA1234A1Z"
 *           description: GST identification number (optional)
 *         panNumber:
 *           type: string
 *           example: "AAAAA1234A"
 *           description: Permanent Account Number (optional)
 *         bankAccountNumber:
 *           type: string
 *           example: "12345678901234"
 *           description: Bank account number (optional)
 *         ifscCode:
 *           type: string
 *           example: "SBIN0012345"
 *           description: IFSC code (optional)
 *         bankName:
 *           type: string
 *           example: "State Bank of India"
 *           description: Bank name (optional)
 *     
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "rajesh@example.com"
 *           description: Registered email address
 *         password:
 *           type: string
 *           format: password
 *           example: "password123"
 *           description: Account password
 *     
 *     RefreshTokenRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *           description: Valid refresh token
 *     
 *     UserProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "67f847d21ec67b545d327090"
 *         name:
 *           type: string
 *           example: "Rajesh Sharma"
 *         email:
 *           type: string
 *           example: "rajesh@example.com"
 *         role:
 *           type: string
 *           enum: [superadmin, operator]
 *           example: "operator"
 *         phone:
 *           type: string
 *           example: "+91 98765 43210"
 *         businessName:
 *           type: string
 *           example: "Master Dealer"
 *         address:
 *           type: string
 *           example: "123, Market Yard, Pune, Maharashtra - 411001"
 *         city:
 *           type: string
 *           example: "Pune"
 *         state:
 *           type: string
 *           example: "Maharashtra"
 *         gstNumber:
 *           type: string
 *           example: "27AAAAA1234A1Z"
 *         panNumber:
 *           type: string
 *           example: "AAAAA1234A"
 *         bankAccountNumber:
 *           type: string
 *           example: "XXXX-XXXX-1234"
 *           description: Masked bank account number
 *         ifscCode:
 *           type: string
 *           example: "SBIN0012345"
 *         bankName:
 *           type: string
 *           example: "State Bank of India"
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         lastLoginAt:
 *           type: string
 *           format: date-time
 *     
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Login successful"
 *         user:
 *           $ref: '#/components/schemas/UserProfile'
 *         accessToken:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIs..."
 *         refreshToken:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIs..."
 *     
 *     ProfileUpdateRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Rajesh Sharma"
 *         phone:
 *           type: string
 *           example: "+91 98765 43210"
 *         businessName:
 *           type: string
 *           example: "Master Dealer"
 *         address:
 *           type: string
 *           example: "123, Market Yard, Pune, Maharashtra - 411001"
 *         city:
 *           type: string
 *           example: "Pune"
 *         state:
 *           type: string
 *           example: "Maharashtra"
 *         gstNumber:
 *           type: string
 *           example: "27AAAAA1234A1Z"
 *         panNumber:
 *           type: string
 *           example: "AAAAA1234A"
 *         bankAccountNumber:
 *           type: string
 *           example: "12345678901234"
 *         ifscCode:
 *           type: string
 *           example: "SBIN0012345"
 *         bankName:
 *           type: string
 *           example: "State Bank of India"
 *     
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: "Invalid credentials"
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: >
 *       Create a new user account with superadmin or operator role.
 *       Optional profile fields can be included during registration.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             superadmin:
 *               summary: SuperAdmin with full profile
 *               value:
 *                 name: "Rajesh Sharma"
 *                 email: "admin@example.com"
 *                 password: "Admin@123"
 *                 role: "superadmin"
 *                 phone: "+91 98765 43210"
 *                 businessName: "Master Dealer"
 *                 address: "123, Market Yard, Pune, Maharashtra - 411001"
 *                 city: "Pune"
 *                 state: "Maharashtra"
 *                 gstNumber: "27AAAAA1234A1Z"
 *                 panNumber: "AAAAA1234A"
 *                 bankAccountNumber: "12345678901234"
 *                 ifscCode: "SBIN0012345"
 *                 bankName: "State Bank of India"
 *             operator:
 *               summary: Operator with basic info
 *               value:
 *                 name: "John Doe"
 *                 email: "john@example.com"
 *                 password: "password123"
 *                 role: "operator"
 *                 phone: "+91 98765 43210"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user and receive tokens
 *     description: Login with email and password to receive access and refresh tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials or inactive account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Generate a new access token using a valid refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Invalid or expired refresh token
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout from current session
 *     description: Invalidate the current refresh token and end the session
 *     tags: [Authentication]
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
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: >
 *       Retrieve the authenticated user's complete profile including
 *       all optional fields (GST, bank details, address, etc.)
 *     tags: [Authentication]
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
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /auth/me:
 *   put:
 *     summary: Update user profile
 *     description: >
 *       Update the authenticated user's profile information.
 *       All fields are optional - only send the fields you want to update.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfileUpdateRequest'
 *           example:
 *             name: "Rajesh Sharma"
 *             phone: "+91 98765 43210"
 *             businessName: "Master Dealer"
 *             address: "123, Market Yard, Pune, Maharashtra - 411001"
 *             city: "Pune"
 *             state: "Maharashtra"
 *             gstNumber: "27AAAAA1234A1Z"
 *             bankAccountNumber: "12345678901234"
 *             ifscCode: "SBIN0012345"
 *             bankName: "State Bank of India"
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
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

// Routes
router.post('/register', validateUserRegistration, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/refresh', validateRefreshToken, authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.put('/me', authenticate, authController.updateProfile);

module.exports = router;