/**
 * Operations Routes
 */

import { Router } from 'express';
import { makeInvoker } from 'awilix-express';
import { OperationsController } from '../controllers/operations';
import { validate } from '../middlewares/validation.middleware';
import { createOperationSchema, updateOperationSchema, registerPaymentSchema } from '../dtos/operations.dto';

const router = Router();
const api = makeInvoker(OperationsController);

// Auth middleware is applied globally to all /api/* routes in routes/index.ts

/**
 * @swagger
 * /api/operations:
 *   get:
 *     summary: Listar operações
 *     tags: [Operations]
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
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *         description: Filtrar por ID do cliente
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [LOAN, INVESTMENT, LEASE, SALE]
 *         description: Filtrar por tipo de operação
 *     responses:
 *       200:
 *         description: Lista de operações
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
 * /api/operations/{id}:
 *   get:
 *     summary: Obter operação por ID
 *     tags: [Operations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da operação (BigInt como string)
 *         example: "1"
 *     responses:
 *       200:
 *         description: Dados da operação
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
 *         description: Operação não encontrada
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
 * /api/operations:
 *   post:
 *     summary: Criar nova operação
 *     tags: [Operations]
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
 *               - clientId
 *               - type
 *               - principalAmount
 *               - startDate
 *             properties:
 *               accountId:
 *                 type: integer
 *                 example: 1
 *               clientId:
 *                 type: integer
 *                 example: 1
 *               type:
 *                 type: string
 *                 enum: [LOAN, INVESTMENT, LEASE, SALE]
 *                 example: "LOAN"
 *               title:
 *                 type: string
 *                 nullable: true
 *                 example: "Empréstimo Pessoal"
 *               description:
 *                 type: string
 *                 nullable: true
 *               principalAmount:
 *                 type: number
 *                 example: 10000.50
 *               currency:
 *                 type: string
 *                 enum: [BRL, USD, EUR]
 *                 default: BRL
 *                 example: "BRL"
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-01T00:00:00Z"
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               frequency:
 *                 type: string
 *                 enum: [MONTHLY, WEEKLY, DAILY, YEARLY]
 *                 nullable: true
 *                 example: "MONTHLY"
 *               interestRate:
 *                 type: number
 *                 nullable: true
 *                 example: 2.5
 *               entryAmount:
 *                 type: number
 *                 nullable: true
 *               installments:
 *                 type: integer
 *                 nullable: true
 *                 example: 12
 *               depositAmount:
 *                 type: number
 *                 nullable: true
 *               resourceId:
 *                 type: integer
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Operação criada com sucesso (parcelas geradas automaticamente)
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
router.post('/', validate(createOperationSchema), api('create'));

/**
 * @swagger
 * /api/operations/{id}:
 *   put:
 *     summary: Atualizar operação
 *     tags: [Operations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da operação (BigInt como string)
 *         example: "1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               principalAmount:
 *                 type: number
 *               status:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Operação atualizada com sucesso
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
 *         description: Operação não encontrada
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
router.put('/:id', validate(updateOperationSchema), api('update'));

/**
 * @swagger
 * /api/operations/{id}:
 *   delete:
 *     summary: Deletar operação (soft delete)
 *     tags: [Operations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da operação (BigInt como string)
 *         example: "1"
 *     responses:
 *       204:
 *         description: Operação deletada com sucesso
 *       404:
 *         description: Operação não encontrada
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

/**
 * @swagger
 * /api/operations/{id}/register-payment:
 *   post:
 *     summary: Registrar pagamento para uma operação
 *     tags: [Operations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da operação (BigInt como string)
 *         example: "1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 1000.00
 *               installmentId:
 *                 type: string
 *                 nullable: true
 *                 description: ID da parcela (se não informado, aplica ao próximo vencimento)
 *                 example: "1"
 *               method:
 *                 type: string
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
 *         description: Pagamento registrado com sucesso
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
 *       400:
 *         description: Dados inválidos ou parcela não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Operação não encontrada
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
router.post('/:id/register-payment', validate(registerPaymentSchema), api('registerPayment'));

/**
 * @swagger
 * /api/operations/{id}/trigger-alert:
 *   post:
 *     summary: Disparar alerta para uma operação
 *     tags: [Operations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da operação (BigInt como string)
 *         example: "1"
 *     responses:
 *       200:
 *         description: Alerta disparado com sucesso
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
 *         description: Operação não encontrada
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
router.post('/:id/trigger-alert', api('triggerAlert'));

export default router;

