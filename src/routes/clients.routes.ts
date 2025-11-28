/**
 * Clients Routes
 */

import { Router } from 'express';
import { makeInvoker } from 'awilix-express';
import { ClientsController } from '../controllers/clientsController';
import { VerificationController } from '../controllers/verificationController';
import { validate } from '../middlewares/validation.middleware';
import { createClientSchema, updateClientSchema } from '../dtos/clients.dto';
import {
  sendPhoneVerificationSchema,
  verifyPhoneSchema,
  sendEmailVerificationSchema,
  verifyEmailSchema,
} from '../dtos/verification.dto';

const router = Router();
const api = makeInvoker(ClientsController);

// Auth middleware is applied globally to all /api/* routes in routes/index.ts

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: Listar clientes
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *           minimum: 1
 *         description: Itens por página
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *         description: Filtrar por ID da conta
 *     responses:
 *       200:
 *         description: Lista de clientes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "1"
 *                       name:
 *                         type: string
 *                         example: "John Doe"
 *                       email:
 *                         type: string
 *                         nullable: true
 *                       phone:
 *                         type: string
 *                         nullable: true
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', api('index'));



/**
 * @swagger
 * /api/clients/consult/{document}:
 *   get:
 *     summary: Consultar cliente por documento
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: document
 *         required: true
 *         schema:
 *           type: string
 *         description: Documento do cliente (CPF/CNPJ)
 *         example: "12345678900"
 *     responses:
 *       200:
 *         description: Cliente encontrado
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
 *                       type: string
 *                       example: "1"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     document:
 *                       type: string
 *                       example: "12345678900"
 *       404:
 *         description: Cliente não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * */
router.get('/consult/:document', api('consultDocument'));

/**
 * @swagger
 * /api/clients/{id}:
 *   get:
 *     summary: Obter cliente por ID
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente (BigInt como string)
 *         example: "1"
 *     responses:
 *       200:
 *         description: Dados do cliente
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
 *                       type: string
 *                       example: "1"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       nullable: true
 *                     phone:
 *                       type: string
 *                       nullable: true
 *                     accountId:
 *                       type: string
 *                       example: "1"
 *       404:
 *         description: Cliente não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', api('show'));

/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Criar novo cliente
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountId
 *               - name
 *             properties:
 *               accountId:
 *                 type: integer
 *                 example: 1
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 nullable: true
 *                 example: "john@example.com"
 *               phone:
 *                 type: string
 *                 nullable: true
 *                 example: "+5511999999999"
 *               meta:
 *                 type: object
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Cliente criado com sucesso
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
 *                       type: string
 *                       example: "1"
 *                     name:
 *                       type: string
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', validate(createClientSchema), api('create'));

/**
 * @swagger
 * /api/clients/{id}:
 *   put:
 *     summary: Atualizar cliente
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente (BigInt como string)
 *         example: "1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Updated"
 *               email:
 *                 type: string
 *                 format: email
 *                 nullable: true
 *               phone:
 *                 type: string
 *                 nullable: true
 *               meta:
 *                 type: object
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Cliente atualizado com sucesso
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
 *       404:
 *         description: Cliente não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', validate(updateClientSchema), api('update'));

/**
 * @swagger
 * /api/clients/{id}:
 *   delete:
 *     summary: Deletar cliente (soft delete)
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente (BigInt como string)
 *         example: "1"
 *     responses:
 *       204:
 *         description: Cliente deletado com sucesso
 *       404:
 *         description: Cliente não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', api('delete'));

// Verification routes
const verificationApi = makeInvoker(VerificationController);

/**
 * @swagger
 * /api/clients/{id}/verify/phone/send:
 *   post:
 *     summary: Send verification code to phone (WhatsApp)
 *     tags: [Clients, Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Client ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 oneOf:
 *                   - type: string
 *                   - type: object
 *                     properties:
 *                       phoneNumber:
 *                         type: string
 *                       formattedPhoneNumber:
 *                         type: string
 *                       countryCode:
 *                         type: string
 *     responses:
 *       200:
 *         description: Verification code sent successfully
 *       400:
 *         description: Invalid request
 */
router.post('/:id/verify/phone/send', validate(sendPhoneVerificationSchema), verificationApi('sendPhoneVerification'));

/**
 * @swagger
 * /api/clients/{id}/verify/phone:
 *   post:
 *     summary: Verify phone code
 *     tags: [Clients, Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Client ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 4
 *                 maxLength: 10
 *     responses:
 *       200:
 *         description: Phone verified successfully
 *       400:
 *         description: Invalid code or expired
 */
router.post('/:id/verify/phone', validate(verifyPhoneSchema), verificationApi('verifyPhone'));

/**
 * @swagger
 * /api/clients/{id}/verify/email/send:
 *   post:
 *     summary: Send verification code to email
 *     tags: [Clients, Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Client ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification code sent successfully
 *       400:
 *         description: Invalid request
 */
router.post('/:id/verify/email/send', validate(sendEmailVerificationSchema), verificationApi('sendEmailVerification'));

/**
 * @swagger
 * /api/clients/{id}/verify/email:
 *   post:
 *     summary: Verify email code
 *     tags: [Clients, Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Client ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 4
 *                 maxLength: 10
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid code or expired
 */
router.post('/:id/verify/email', validate(verifyEmailSchema), verificationApi('verifyEmail'));

/**
 * @swagger
 * /api/clients/{id}/verify/status:
 *   get:
 *     summary: Get verification status
 *     tags: [Clients, Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Client ID
 *     responses:
 *       200:
 *         description: Verification status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 phoneVerified:
 *                   type: boolean
 *                 emailVerified:
 *                   type: boolean
 *                 phoneVerifiedAt:
 *                   type: string
 *                   format: date-time
 *                 emailVerifiedAt:
 *                   type: string
 *                   format: date-time
 */
router.get('/:id/verify/status', verificationApi('getVerificationStatus'));

export default router;

