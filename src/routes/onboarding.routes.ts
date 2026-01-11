/**
 * Onboarding Routes
 * Public routes for step-by-step onboarding process
 */

import { Router } from 'express';
import { makeInvoker } from 'awilix-express';
import { OnboardingController } from '../controllers/onboardingController';
import { validate, validateQuery } from '../middlewares/validation.middleware';
import { onboardingSaveSchema, onboardingSubmitSchema, onboardingPlansQuerySchema } from '../dtos/onboarding.dto';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const api = makeInvoker(OnboardingController);

// All onboarding routes now require authentication (token required)


/**
 * @swagger
 * /api/onboarding/save:
 *   post:
 *     summary: Save onboarding data (progressive submission)
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     description: Handles step-by-step data submission during onboarding. Creates/updates client and account as user progresses. Requires authentication token.
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
 *                 description: Email address (required - primary identifier)
 *                 example: "user@example.com"
 *               document:
 *                 type: string
 *                 description: Document (optional - CPF, CNPJ, SSN, EIN, NI, CRN, etc)
 *                 example: "05480695142"
 *               documentType:
 *                 type: string
 *                 enum: [cpf, cnpj, ssn, ein, ni, crn, other]
 *                 description: Document type (optional - required if document is provided)
 *                 example: "cpf"
 *               documentCountryCode:
 *                 type: string
 *                 description: ISO country code (optional - required if document is provided)
 *                 example: "BR"
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
 *               emailCode:
 *                 type: string
 *                 description: Email verification code (optional, step 7-8)
 *                 example: "123456"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Password for account owner (optional, step 9)
 *                 example: "SecurePass123!"
 *               activeCustomers:
 *                 type: number
 *                 description: Max number of active customers (optional, step 10)
 *                 example: 50
 *               financialOperations:
 *                 type: number
 *                 description: Max operations per month (optional, step 11)
 *                 example: 20
 *               workingCapital:
 *                 type: number
 *                 description: Working capital in actual currency units (optional, step 12)
 *                 example: 50000
 *               businessDuration:
 *                 type: number
 *                 description: Business duration in months (optional, step 13)
 *                 example: 24
 *               businessOptions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [lendMoney, promissoryNotes, rentProperties, rentRooms, rentVehicles]
 *                 description: Business type options (optional, step 14)
 *                 example: ["lendMoney", "promissoryNotes"]
 *               address:
 *                 type: object
 *                 description: Address data (optional, step 15-17)
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
 *                 description: Terms acceptance (required for completion, step 18)
 *               privacyAccepted:
 *                 type: boolean
 *                 description: Privacy policy acceptance (required for completion, step 18)
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
 *                       enum: [email, document, name, phone, phone_verification, email_verification, password, active_customers, financial_operations, capital, business_duration, business_options, address, completed]
 *                     message:
 *                       type: string
 *                     savedFields:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Fields that were saved in this request
 *                       example: ["email", "name", "phone"]
 *       400:
 *         description: Invalid data or verification failed
 *       409:
 *         description: Email already exists
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
 *                   example: "EMAIL_ALREADY_EXISTS"
 *                 message:
 *                   type: string
 *                 code:
 *                   type: number
 *                   example: 409
 */
router.post('/save', authMiddleware, validate(onboardingSaveSchema), api('save'));

/**
 * @swagger
 * /api/onboarding/submit:
 *   post:
 *     summary: Submit onboarding - finalize registration (99% - Options screen)
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     description: Finalizes onboarding process. Creates user account and returns JWT tokens for automatic login. Called when user selects business options (99% complete). Requires authentication token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - businessOptions
 *               - termsAccepted
 *               - privacyAccepted
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address (required)
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Password (required - must contain uppercase, lowercase, number, and special character)
 *                 example: "SecurePass123!"
 *               name:
 *                 type: string
 *                 description: Full name (required)
 *                 example: "John Doe"
 *               document:
 *                 type: string
 *                 description: Document (optional)
 *                 example: "05480695142"
 *               documentType:
 *                 type: string
 *                 enum: [cpf, cnpj, ssn, ein, ni, crn, other]
 *                 description: Document type (required if document is provided)
 *                 example: "cpf"
 *               documentCountryCode:
 *                 type: string
 *                 description: ISO country code (required if document is provided)
 *                 example: "BR"
 *               phone:
 *                 type: object
 *                 description: Phone data (optional)
 *                 properties:
 *                   country:
 *                     type: string
 *                   countryCode:
 *                     type: string
 *                   phoneNumber:
 *                     type: string
 *                   formattedPhoneNumber:
 *                     type: string
 *               address:
 *                 type: object
 *                 description: Address data (optional)
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
 *               activeCustomers:
 *                 type: number
 *                 description: Max number of active customers (optional)
 *                 example: 50
 *               financialOperations:
 *                 type: number
 *                 description: Max operations per month (optional)
 *                 example: 20
 *               workingCapital:
 *                 type: number
 *                 description: Working capital (optional)
 *                 example: 50000
 *               businessDuration:
 *                 type: number
 *                 description: Business duration in months (optional)
 *                 example: 24
 *               businessOptions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [lendMoney, promissoryNotes, rentProperties, rentRooms, rentVehicles]
 *                 description: Business options (required - at least one must be selected)
 *                 minItems: 1
 *                 example: ["lendMoney", "promissoryNotes"]
 *               termsAccepted:
 *                 type: boolean
 *                 description: Terms acceptance (required)
 *                 example: true
 *               privacyAccepted:
 *                 type: boolean
 *                 description: Privacy policy acceptance (required)
 *                 example: true
 *               accountName:
 *                 type: string
 *                 description: Account name (optional)
 *               accountEmail:
 *                 type: string
 *                 format: email
 *                 description: Account email (optional)
 *               planId:
 *                 type: number
 *                 description: Selected plan ID (optional)
 *               clientStatus:
 *                 type: string
 *                 enum: [NOT_STARTED, IN_PROGRESS, COMPLETED]
 *                 description: Onboarding status (optional, controlled by frontend - saved to PlatformUser meta)
 *                 example: "COMPLETED"
 *               onboardingStep:
 *                 type: string
 *                 description: Current onboarding step (optional, controlled by frontend - saved to PlatformUser meta)
 *                 example: "completed"
 *               clientStatus:
 *                 type: string
 *                 enum: [NOT_STARTED, IN_PROGRESS, COMPLETED]
 *                 description: Onboarding status (optional, controlled by frontend)
 *                 example: "IN_PROGRESS"
 *               onboardingStep:
 *                 type: string
 *                 description: Current onboarding step (optional, controlled by frontend)
 *                 example: "email_verification"
 *     responses:
 *       200:
 *         description: Registration completed successfully
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
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     userId:
 *                       type: number
 *                       example: 123
 *                     accountId:
 *                       type: number
 *                       example: 456
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     message:
 *                       type: string
 *                       example: "Registration completed successfully"
 *       400:
 *         description: Invalid data, missing required fields, weak password, or verification failed
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
 *                   enum: [INVALID_DOCUMENT, MISSING_REQUIRED_FIELDS, WEAK_PASSWORD, EMAIL_NOT_VERIFIED, PHONE_NOT_VERIFIED]
 *                 message:
 *                   type: string
 *                 code:
 *                   type: number
 *                 missingFields:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Missing required fields (only for MISSING_REQUIRED_FIELDS error)
 *                 details:
 *                   type: object
 *                   description: Additional error details (only for INVALID_DOCUMENT error)
 *                   properties:
 *                     documentType:
 *                       type: string
 *                     countryCode:
 *                       type: string
 *       409:
 *         description: Email or document already exists
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
 *                   enum: [EMAIL_ALREADY_EXISTS, DOCUMENT_ALREADY_EXISTS]
 *                 message:
 *                   type: string
 *                 code:
 *                   type: number
 *                   example: 409
 *                 details:
 *                   type: object
 *                   description: Additional error details (only for DOCUMENT_ALREADY_EXISTS)
 */
router.post('/submit', authMiddleware, validate(onboardingSubmitSchema), api('submit'));

/**
 * @swagger
 * /api/onboarding/progress:
 *   get:
 *     summary: Get onboarding progress
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieve current onboarding progress by email or document. Email takes priority if both are provided. Requires authentication token.
 *     parameters:
 *       - in: query
 *         name: email
 *         required: false
 *         schema:
 *           type: string
 *           format: email
 *         description: Email address (primary identifier)
 *         example: "user@example.com"
 *       - in: query
 *         name: document
 *         required: false
 *         schema:
 *           type: string
 *         description: Document (CPF, CNPJ, SSN, EIN, NI, CRN, etc) - for backward compatibility
 *         example: "05480695142"
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
 *                     status:
 *                       type: string
 *                       enum: [NOT_STARTED, IN_PROGRESS, COMPLETED]
 *                       description: Status do cadastro (não iniciado, em progresso, finalizado)
 *                       example: "IN_PROGRESS"
 *                     step:
 *                       type: string
 *                     data:
 *                       type: object
 *                       properties:
 *                         email:
 *                           type: string
 *                         document:
 *                           type: string
 *                         documentType:
 *                           type: string
 *                         documentCountryCode:
 *                           type: string
 *                         name:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         phoneVerified:
 *                           type: boolean
 *                         emailVerified:
 *                           type: boolean
 *                         address:
 *                           type: object
 *                         activeCustomers:
 *                           type: number
 *                         financialOperations:
 *                           type: number
 *                         workingCapital:
 *                           type: number
 *                         businessDuration:
 *                           type: number
 *                         businessOptions:
 *                           type: array
 *                           items:
 *                             type: string
 *       400:
 *         description: Email or document is required
 */
router.get('/progress', authMiddleware, api('getProgress'));

/**
 * @swagger
 * /api/onboarding/plans:
 *   get:
 *     summary: Get recommended plans based on business metrics
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     description: Returns recommended plans based on business metrics (activeCustomers, financialOperations, workingCapital, businessDuration). Requires authentication token.
 *     parameters:
 *       - in: query
 *         name: activeCustomers
 *         required: false
 *         schema:
 *           type: number
 *         description: Max number of active customers
 *         example: 50
 *       - in: query
 *         name: financialOperations
 *         required: false
 *         schema:
 *           type: number
 *         description: Max operations per month
 *         example: 20
 *       - in: query
 *         name: workingCapital
 *         required: false
 *         schema:
 *           type: number
 *         description: Working capital in actual currency units
 *         example: 50000
 *       - in: query
 *         name: businessDuration
 *         required: false
 *         schema:
 *           type: number
 *         description: Business duration in months
 *         example: 24
 *     responses:
 *       200:
 *         description: Recommended plans
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
 *                     plans:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: number
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           prices:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 currency:
 *                                   type: string
 *                                 price:
 *                                   type: number
 *                                 isDefault:
 *                                   type: boolean
 *                           features:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 key:
 *                                   type: string
 *                                 name:
 *                                   type: string
 *                           recommended:
 *                             type: boolean
 *                             description: True for the plan with highest matchScore
 *                           matchScore:
 *                             type: number
 *                             description: Score from 0-100 indicating how well the plan matches
 *                             example: 85
 */
router.get('/plans', authMiddleware, validateQuery(onboardingPlansQuerySchema), api('getPlans'));

export default router;

