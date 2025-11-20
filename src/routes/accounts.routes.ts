/**
 * Accounts Routes
 */

import { Router } from 'express';
import { makeInvoker } from 'awilix-express';
import { AccountsController } from '../controllers/accounts';
import { validate } from '../middlewares/validation.middleware';
import { createAccountSchema, updateAccountSchema } from '../dtos/accounts.dto';

const router = Router();
const api = makeInvoker(AccountsController);

// Auth middleware is applied globally to all /api/* routes in routes/index.ts

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Listar contas
 *     tags: [Accounts]
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
 *     responses:
 *       200:
 *         description: Lista de contas
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
 *                         example: "My Account"
 *                       email:
 *                         type: string
 *                         example: "account@example.com"
 *                       status:
 *                         type: string
 *                         example: "ACTIVE"
 *                       currency:
 *                         type: string
 *                         example: "BRL"
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
 * /api/accounts/{id}:
 *   get:
 *     summary: Obter conta por ID
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da conta (BigInt como string)
 *         example: "1"
 *     responses:
 *       200:
 *         description: Dados da conta
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
 *                       example: "My Account"
 *                     email:
 *                       type: string
 *                       example: "account@example.com"
 *                     phone:
 *                       type: string
 *                       nullable: true
 *                     document:
 *                       type: string
 *                       nullable: true
 *                     status:
 *                       type: string
 *                       example: "ACTIVE"
 *                     currency:
 *                       type: string
 *                       example: "BRL"
 *       404:
 *         description: Conta não encontrada
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
 * /api/accounts:
 *   post:
 *     summary: Criar nova conta
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: "My Account"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "account@example.com"
 *               phone:
 *                 type: string
 *                 nullable: true
 *                 example: "+5511999999999"
 *               document:
 *                 type: string
 *                 nullable: true
 *                 example: "12345678901"
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 default: ACTIVE
 *                 example: "ACTIVE"
 *               currency:
 *                 type: string
 *                 enum: [BRL, USD, EUR]
 *                 default: BRL
 *                 example: "BRL"
 *               plan:
 *                 type: string
 *                 nullable: true
 *               ownerId:
 *                 type: integer
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Conta criada com sucesso
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
 *                     email:
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
router.post('/', validate(createAccountSchema), api('create'));

/**
 * @swagger
 * /api/accounts/{id}:
 *   put:
 *     summary: Atualizar conta
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da conta (BigInt como string)
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
 *                 example: "Updated Account Name"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "updated@example.com"
 *               phone:
 *                 type: string
 *                 nullable: true
 *               document:
 *                 type: string
 *                 nullable: true
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *               currency:
 *                 type: string
 *                 enum: [BRL, USD, EUR]
 *     responses:
 *       200:
 *         description: Conta atualizada com sucesso
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
 *         description: Conta não encontrada
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
router.put('/:id', validate(updateAccountSchema), api('update'));

/**
 * @swagger
 * /api/accounts/{id}:
 *   delete:
 *     summary: Deletar conta (soft delete)
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da conta (BigInt como string)
 *         example: "1"
 *     responses:
 *       204:
 *         description: Conta deletada com sucesso
 *       404:
 *         description: Conta não encontrada
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

export default router;
