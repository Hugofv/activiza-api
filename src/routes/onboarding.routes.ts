/**
 * Onboarding Routes
 * Public routes for step-by-step onboarding process
 */

import { Router } from 'express';
import { makeInvoker } from 'awilix-express';
import { OnboardingController } from '../controllers/onboarding';
import { validate } from '../middlewares/validation.middleware';
import { onboardingSaveSchema } from '../dtos/onboarding.dto';

const router = Router();
const api = makeInvoker(OnboardingController);

// Onboarding routes are public (no auth required)

/**
 * @swagger
 * /api/onboarding/save:
 *   post:
 *     summary: Save onboarding data (progressive submission)
 *     tags: [Onboarding]
 *     description: Handles step-by-step data submission during onboarding. Creates/updates client and account as user progresses.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - document
 *             properties:
 *               document:
 *                 type: string
 *                 description: CPF or CNPJ (required)
 *                 example: "054.806.951-42"
 *               name:
 *                 type: string
 *                 description: Client name (optional, step 2)
 *                 example: "John Doe"
 *               phone:
 *                 type: object
 *                 description: Phone data (optional, step 3)
 *                 properties:
 *                   country:
 *                     type: string
 *                   countryCode:
 *                     type: string
 *                   phoneNumber:
 *                     type: string
 *                   formattedPhoneNumber:
 *                     type: string
 *               code:
 *                 type: string
 *                 description: WhatsApp verification code (optional, step 4-5)
 *                 example: "123456"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address (optional, step 6)
 *                 example: "user@example.com"
 *               emailCode:
 *                 type: string
 *                 description: Email verification code (optional, step 7-8)
 *                 example: "123456"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Password for account owner (optional, step 9)
 *                 example: "SecurePass123!"
 *               address:
 *                 type: object
 *                 description: Address data (optional, step 10-13)
 *                 properties:
 *                   postalCode:
 *                     type: string
 *                   street:
 *                     type: string
 *                   neighborhood:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *                   number:
 *                     type: string
 *                   complement:
 *                     type: string
 *               termsAccepted:
 *                 type: boolean
 *                 description: Terms acceptance (required for completion, step 14)
 *               privacyAccepted:
 *                 type: boolean
 *                 description: Privacy policy acceptance (required for completion, step 14)
 *               accountName:
 *                 type: string
 *                 description: Account name (optional, defaults to client name)
 *               accountEmail:
 *                 type: string
 *                 format: email
 *                 description: Account email (optional, defaults to client email)
 *     responses:
 *       200:
 *         description: Data saved successfully
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
 *                     clientId:
 *                       type: number
 *                     accountId:
 *                       type: number
 *                     ownerId:
 *                       type: number
 *                     step:
 *                       type: string
 *                       enum: [document, name, phone, phone_verification, email, email_verification, password, address, completed]
 *                     message:
 *                       type: string
 *       400:
 *         description: Invalid data or verification failed
 */
router.post('/save', validate(onboardingSaveSchema), api('save'));

/**
 * @swagger
 * /api/onboarding/progress:
 *   get:
 *     summary: Get onboarding progress
 *     tags: [Onboarding]
 *     description: Retrieve current onboarding progress for a document
 *     parameters:
 *       - in: query
 *         name: document
 *         required: true
 *         schema:
 *           type: string
 *         description: CPF or CNPJ
 *         example: "054.806.951-42"
 *     responses:
 *       200:
 *         description: Onboarding progress
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
 *                     clientId:
 *                       type: number
 *                     accountId:
 *                       type: number
 *                     step:
 *                       type: string
 *                     data:
 *                       type: object
 *       400:
 *         description: Document is required
 */
router.get('/progress', api('getProgress'));

export default router;

