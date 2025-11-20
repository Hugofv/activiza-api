/**
 * Installments Routes
 */

import { Router } from 'express';
import { makeInvoker } from 'awilix-express';
import { InstallmentsController } from '../controllers/installments';
import { validate } from '../middlewares/validation.middleware';
import { updateInstallmentSchema } from '../dtos/installments.dto';

const router = Router();
const api = makeInvoker(InstallmentsController);

// Auth middleware is applied globally to all /api/* routes in routes/index.ts

/**
 * @swagger
 * /api/installments:
 *   get:
 *     summary: Listar parcelas
 *     tags: [Installments]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID, OVERDUE, CANCELLED]
 *         description: Filtrar por status
 *     responses:
 *       200:
 *         description: Lista de parcelas
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
 * /api/installments/{id}:
 *   get:
 *     summary: Obter parcela por ID
 *     tags: [Installments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da parcela (BigInt como string)
 *         example: "1"
 *     responses:
 *       200:
 *         description: Dados da parcela
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
 *                     operationId:
 *                       type: string
 *                       example: "1"
 *                     amount:
 *                       type: number
 *                       example: 1000.00
 *                     dueDate:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                       example: "PENDING"
 *       404:
 *         description: Parcela não encontrada
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
 * /api/installments/{id}:
 *   patch:
 *     summary: Atualizar parcela
 *     tags: [Installments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da parcela (BigInt como string)
 *         example: "1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               amount:
 *                 type: number
 *                 nullable: true
 *               notes:
 *                 type: string
 *                 nullable: true
 *               status:
 *                 type: string
 *                 enum: [PENDING, PAID, OVERDUE, CANCELLED]
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Parcela atualizada com sucesso
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
 *         description: Parcela não encontrada
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
router.patch('/:id', validate(updateInstallmentSchema), api('update'));

/**
 * @swagger
 * /api/installments/{id}/mark-paid:
 *   patch:
 *     summary: Marcar parcela como paga
 *     tags: [Installments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da parcela (BigInt como string)
 *         example: "1"
 *     responses:
 *       200:
 *         description: Parcela marcada como paga
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
 *         description: Parcela não encontrada
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
router.patch('/:id/mark-paid', api('markPaid'));

export default router;

