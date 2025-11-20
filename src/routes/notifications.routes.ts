/**
 * Notifications Routes
 */

import { Router } from 'express';
import { makeInvoker } from 'awilix-express';
import { NotificationsController } from '../controllers/notifications';

const router = Router();
const api = makeInvoker(NotificationsController);

// Auth middleware is applied globally to all /api/* routes in routes/index.ts

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Listar notificações
 *     tags: [Notifications]
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
 *         name: read
 *         schema:
 *           type: boolean
 *         description: Filtrar por status de leitura
 *     responses:
 *       200:
 *         description: Lista de notificações
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
 * /api/notifications/{id}:
 *   get:
 *     summary: Obter notificação por ID
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da notificação (BigInt como string)
 *         example: "1"
 *     responses:
 *       200:
 *         description: Dados da notificação
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
 *                     title:
 *                       type: string
 *                       example: "Nova parcela vencida"
 *                     message:
 *                       type: string
 *                     read:
 *                       type: boolean
 *                       example: false
 *       404:
 *         description: Notificação não encontrada
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
 * /api/notifications:
 *   post:
 *     summary: Criar nova notificação
 *     tags: [Notifications]
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
 *               - title
 *               - message
 *             properties:
 *               accountId:
 *                 type: integer
 *                 example: 1
 *               title:
 *                 type: string
 *                 example: "Nova parcela vencida"
 *               message:
 *                 type: string
 *                 example: "A parcela #123 está vencida há 5 dias"
 *               channel:
 *                 type: string
 *                 enum: [EMAIL, SMS, PUSH, IN_APP]
 *                 nullable: true
 *               meta:
 *                 type: object
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Notificação criada com sucesso
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
 * /api/notifications/{id}:
 *   put:
 *     summary: Atualizar notificação
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da notificação (BigInt como string)
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
 *               message:
 *                 type: string
 *               read:
 *                 type: boolean
 *               meta:
 *                 type: object
 *     responses:
 *       200:
 *         description: Notificação atualizada com sucesso
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
 *         description: Notificação não encontrada
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
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Marcar notificação como lida
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da notificação (BigInt como string)
 *         example: "1"
 *     responses:
 *       200:
 *         description: Notificação marcada como lida
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
 *         description: Notificação não encontrada
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
router.patch('/:id/read', api('markAsRead'));

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Deletar notificação (soft delete)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da notificação (BigInt como string)
 *         example: "1"
 *     responses:
 *       204:
 *         description: Notificação deletada com sucesso
 *       404:
 *         description: Notificação não encontrada
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

