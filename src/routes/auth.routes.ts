/**
 * Authentication Routes
 */

import { Router, Request, Response } from 'express';
import { validate } from '../middlewares/validation.middleware';
import { loginSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema, registerSchema } from '../dtos/auth.dto';
import { authMiddleware } from '../middlewares/auth.middleware';
import { AuthService } from '../services/authService';
import { AuthController } from '../controllers/authController';
import { prisma } from '../prisma/client';

const router = Router();

// Create controller instance directly (bypassing Awilix for auth routes)
// This ensures auth routes work even if Awilix has issues resolving the controller
// Using the shared PrismaClient instance from prisma/client.ts
const authService = new AuthService({ prisma });
const authController = new AuthController(authService);

// Helper to wrap controller methods with error handling
const wrapHandler = (handler: (req: Request, res: Response) => Promise<void>) => {
  return async (req: Request, res: Response) => {
    try {
      await handler(req, res);
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: {
            message: error instanceof Error ? error.message : 'Internal server error',
            code: 'INTERNAL_ERROR',
          },
        });
      }
    }
  };
};

// ==========================================
// PUBLIC ROUTES (No authentication required)
// ==========================================

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Autenticação de usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               document:
 *                 type: string
 *                 example: "12345678900"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *                         expiresIn:
 *                           type: integer
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', validate(loginSchema), wrapHandler((req, res) => authController.login(req, res)));

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Renovar access token
 *     tags: [Auth]
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
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token renovado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     expiresIn:
 *                       type: integer
 *       401:
 *         description: Refresh token inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/refresh', validate(refreshTokenSchema), wrapHandler((req, res) => authController.refresh(req, res)));

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Solicitar reset de senha
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Email enviado (sempre retorna sucesso por segurança)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: If an account exists, a password reset email has been sent
 *       400:
 *         description: Email inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/forgot-password', validate(forgotPasswordSchema), wrapHandler((req, res) => authController.forgotPassword(req, res)));

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Resetar senha com token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 example: abc123def456...
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: newPassword123
 *     responses:
 *       200:
 *         description: Senha resetada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Password reset successfully
 *       400:
 *         description: Token inválido ou expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/reset-password', validate(resetPasswordSchema), wrapHandler((req, res) => authController.resetPassword(req, res)));

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar novo usuário com email e senha
 *     tags: [Auth]
 *     description: Cria um novo usuário (PlatformUser) com apenas email e senha. Se o email já existe como Client no onboarding, vincula automaticamente criando uma Account.
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
 *                 description: Email do usuário
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: Senha (mínimo 8 caracteres, deve conter letra maiúscula, minúscula, número e caractere especial)
 *                 example: SecurePass123!
 *               name:
 *                 type: string
 *                 description: Nome do usuário (opcional)
 *                 example: John Doe
 *     responses:
 *       200:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         email:
 *                           type: string
 *                           example: user@example.com
 *                         name:
 *                           type: string
 *                           example: John Doe
 *                         role:
 *                           type: string
 *                           example: owner
 *                         isActive:
 *                           type: boolean
 *                           example: true
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                         refreshToken:
 *                           type: string
 *                           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                         expiresIn:
 *                           type: integer
 *                           example: 604800
 *       400:
 *         description: Dados inválidos ou senha fraca
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
 *                   example: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
 *       409:
 *         description: Email já registrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Email already registered"
 *                     code:
 *                       type: string
 *                       example: "EMAIL_ALREADY_EXISTS"
 */
router.post('/register', validate(registerSchema), wrapHandler((req, res) => authController.register(req, res)));

/**
 * @swagger
 * /auth/check-email:
 *   get:
 *     summary: Verificar status do email - verificar se email está registrado e retornar status do onboarding
 *     tags: [Auth]
 *     description: Verifica se um email está registrado no sistema (como Client ou PlatformUser) e retorna o status do onboarding se aplicável
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email para verificar
 *         example: "user@example.com"
 *     responses:
 *       200:
 *         description: Informações de status do email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "user@example.com"
 *                     registered:
 *                       type: boolean
 *                       description: Se o email está registrado no sistema
 *                       example: true
 *                     existsAs:
 *                       type: string
 *                       enum: [client, platformUser, both, none]
 *                       description: Tipo de registro (client = apenas no onboarding, platformUser = registro completo, both = existe em ambos, none = não registrado)
 *                       example: "client"
 *                     clientStatus:
 *                       type: string
 *                       enum: [NOT_STARTED, IN_PROGRESS, COMPLETED]
 *                       description: Status do onboarding (apenas se existir como client)
 *                       example: "IN_PROGRESS"
 *                     onboardingStep:
 *                       type: string
 *                       description: Etapa atual do onboarding (apenas se existir como client)
 *                       example: "email_verification"
 *                     accountId:
 *                       type: number
 *                       description: ID da conta se o registro estiver completo
 *                       example: 123
 *                     userId:
 *                       type: number
 *                       description: ID do usuário se existir como PlatformUser
 *                       example: 456
 *                     message:
 *                       type: string
 *                       description: Mensagem legível descrevendo o status
 *                       example: "Email está registrado. Onboarding em progresso (etapa: email_verification)."
 *       400:
 *         description: Formato de email inválido ou parâmetro email ausente
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
 *                   example: "Email is required"
 */
router.get('/check-email', wrapHandler((req, res) => authController.checkEmail(req, res)));

// ==========================================
// PROTECTED ROUTES (Authentication required)
// ==========================================

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Obter dados do usuário autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     email:
 *                       type: string
 *                       example: admin@example.com
 *                     name:
 *                       type: string
 *                       example: Admin User
 *                     role:
 *                       type: string
 *                       example: admin
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', authMiddleware, wrapHandler((req, res) => authController.me(req, res)));

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout (remove token client-side)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Logged out successfully
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/logout', authMiddleware, wrapHandler((req, res) => authController.logout(req, res)));

export default router;
