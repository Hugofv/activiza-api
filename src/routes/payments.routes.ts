/**
 * Payments Routes
 */

import { Router } from 'express';
import { makeInvoker } from 'awilix-express';
import { PaymentsController } from '../controllers/payments';
import { validate } from '../middlewares/validation.middleware';
import { createPaymentSchema } from '../dtos/payments.dto';

const router = Router();
const api = makeInvoker(PaymentsController);

// Auth middleware is applied globally to all /api/* routes in routes/index.ts

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Listar pagamentos
 *     tags: [Payments]
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
 *         name: operationId
 *         schema:
 *           type: string
 *         description: Filtrar por ID da operação
 *       - in: query
 *         name: installmentId
 *         schema:
 *           type: string
 *         description: Filtrar por ID da parcela
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: integer
 *         description: Filtrar por ID do cliente
 *     responses:
 *       200:
 *         description: Lista de pagamentos
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
 * /api/payments/{id}:
 *   get:
 *     summary: Obter pagamento por ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pagamento (BigInt como string)
 *         example: "1"
 *     responses:
 *       200:
 *         description: Dados do pagamento
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
 *                     amount:
 *                       type: number
 *                       example: 1000.00
 *                     currency:
 *                       type: string
 *                       example: "BRL"
 *                     paidAt:
 *                       type: string
 *                       format: date-time
 *                     method:
 *                       type: string
 *                       nullable: true
 *       404:
 *         description: Pagamento não encontrado
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
 * /api/payments:
 *   post:
 *     summary: Criar novo pagamento
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientId
 *               - operationId
 *               - amount
 *             properties:
 *               clientId:
 *                 type: integer
 *                 example: 1
 *               operationId:
 *                 type: string
 *                 description: ID da operação (BigInt como string)
 *                 example: "1"
 *               installmentId:
 *                 type: string
 *                 nullable: true
 *                 description: ID da parcela (BigInt como string)
 *                 example: "1"
 *               amount:
 *                 type: number
 *                 example: 1000.00
 *               currency:
 *                 type: string
 *                 enum: [BRL, USD, EUR]
 *                 default: BRL
 *                 example: "BRL"
 *               paidAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: "2024-01-15T10:30:00Z"
 *               method:
 *                 type: string
 *                 enum: [PIX, BANK_TRANSFER, CASH, CREDIT_CARD, DEBIT_CARD, OTHER]
 *                 nullable: true
 *                 example: "PIX"
 *               reference:
 *                 type: string
 *                 nullable: true
 *                 example: "PIX-123456"
 *               meta:
 *                 type: object
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Pagamento criado com sucesso (atualiza status da parcela automaticamente)
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
 *                     amount:
 *                       type: number
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
router.post('/', validate(createPaymentSchema), api('create'));

export default router;

