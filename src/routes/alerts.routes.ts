/**
 * Alerts Routes
 */

import { Router } from 'express';
import { makeInvoker } from 'awilix-express';
import { AlertsController } from '../controllers/alerts';

const router = Router();
const api = makeInvoker(AlertsController);

// Auth middleware is applied globally to all /api/* routes in routes/index.ts

/**
 * @swagger
 * /api/alerts:
 *   get:
 *     summary: Listar alertas
 *     tags: [Alerts]
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
 *         name: operationId
 *         schema:
 *           type: string
 *         description: Filtrar por ID da operação
 *     responses:
 *       200:
 *         description: Lista de alertas
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
 * /api/alerts/{id}:
 *   get:
 *     summary: Obter alerta por ID
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do alerta (BigInt como string)
 *         example: "1"
 *     responses:
 *       200:
 *         description: Dados do alerta
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
 *         description: Alerta não encontrado
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
 * /api/alerts:
 *   post:
 *     summary: Criar novo alerta
 *     tags: [Alerts]
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
 *               - type
 *               - message
 *             properties:
 *               accountId:
 *                 type: integer
 *                 example: 1
 *               operationId:
 *                 type: string
 *                 nullable: true
 *                 description: ID da operação (BigInt como string)
 *                 example: "1"
 *               type:
 *                 type: string
 *                 example: "OVERDUE_INSTALLMENT"
 *               message:
 *                 type: string
 *                 example: "Parcela vencida há 5 dias"
 *               severity:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *                 nullable: true
 *               meta:
 *                 type: object
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Alerta criado com sucesso
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
router.post('/', api('create'));

/**
 * @swagger
 * /api/alerts/{id}:
 *   put:
 *     summary: Atualizar alerta
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do alerta (BigInt como string)
 *         example: "1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *               resolved:
 *                 type: boolean
 *               meta:
 *                 type: object
 *     responses:
 *       200:
 *         description: Alerta atualizado com sucesso
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
 *         description: Alerta não encontrado
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
router.put('/:id', api('update'));

/**
 * @swagger
 * /api/alerts/{id}:
 *   delete:
 *     summary: Deletar alerta (soft delete)
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do alerta (BigInt como string)
 *         example: "1"
 *     responses:
 *       204:
 *         description: Alerta deletado com sucesso
 *       404:
 *         description: Alerta não encontrado
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

