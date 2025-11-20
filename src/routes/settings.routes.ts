/**
 * Settings Routes
 */

import { Router } from 'express';
import { makeInvoker } from 'awilix-express';
import { SettingsController } from '../controllers/settings';

const router = Router();
const api = makeInvoker(SettingsController);

// Auth middleware is applied globally to all /api/* routes in routes/index.ts

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Listar configurações
 *     tags: [Settings]
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
 *         description: Lista de configurações
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
 * /api/settings/{key}:
 *   get:
 *     summary: Obter configuração por chave
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Chave da configuração
 *         example: "theme"
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *         description: ID da conta (opcional)
 *     responses:
 *       200:
 *         description: Dados da configuração
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
 *                     key:
 *                       type: string
 *                       example: "theme"
 *                     value:
 *                       type: string
 *                       example: "dark"
 *       404:
 *         description: Configuração não encontrada
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
router.get('/:key', api('show'));

/**
 * @swagger
 * /api/settings:
 *   post:
 *     summary: Criar nova configuração
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - value
 *             properties:
 *               accountId:
 *                 type: integer
 *                 nullable: true
 *                 description: ID da conta (opcional, para configurações globais)
 *                 example: 1
 *               key:
 *                 type: string
 *                 example: "theme"
 *               value:
 *                 type: string
 *                 example: "dark"
 *               meta:
 *                 type: object
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Configuração criada com sucesso
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
 * /api/settings/{key}:
 *   put:
 *     summary: Atualizar configuração
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Chave da configuração
 *         example: "theme"
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *         description: ID da conta (opcional)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *                 example: "light"
 *               meta:
 *                 type: object
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Configuração atualizada com sucesso
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
 *         description: Configuração não encontrada
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
router.put('/:key', api('update'));

/**
 * @swagger
 * /api/settings/{key}:
 *   patch:
 *     summary: Criar ou atualizar configuração (upsert)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Chave da configuração
 *         example: "theme"
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *         description: ID da conta (opcional)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: string
 *                 example: "light"
 *               meta:
 *                 type: object
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Configuração criada ou atualizada com sucesso
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
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:key', api('upsert'));

/**
 * @swagger
 * /api/settings/{key}:
 *   delete:
 *     summary: Deletar configuração (soft delete)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Chave da configuração
 *         example: "theme"
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *         description: ID da conta (opcional)
 *     responses:
 *       204:
 *         description: Configuração deletada com sucesso
 *       404:
 *         description: Configuração não encontrada
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
router.delete('/:key', api('delete'));

export default router;

