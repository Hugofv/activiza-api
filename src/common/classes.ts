import HttpStatusCodes from "./HttpStatusCodes";


/**
 * Error with status code and message.
 */
export class RouteError extends Error {

  public status: HttpStatusCodes;

  public constructor(status: HttpStatusCodes, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * If route validation fails.
 */
export class ValidationErr extends RouteError {

  public static MSG = 'The follow parameter were missing or invalid "';

  public constructor(paramName: string) {
    super(HttpStatusCodes.BAD_REQUEST, ValidationErr.GetMsg(paramName));
  }

  public static GetMsg(param: string) {
    return ValidationErr.MSG + param + '".';
  }
}

/**
 * Email already exists error
 */
export class EmailAlreadyExistsError extends RouteError {
  public constructor(email?: string) {
    super(
      HttpStatusCodes.CONFLICT,
      email ? `Email ${email} já está cadastrado` : 'Este email já está cadastrado'
    );
  }
}

/**
 * Document already exists error
 */
export class DocumentAlreadyExistsError extends RouteError {
  public details?: { documentType?: string; countryCode?: string };

  public constructor(documentType?: string, countryCode?: string) {
    super(
      HttpStatusCodes.CONFLICT,
      'Este documento já está cadastrado neste país'
    );
    this.details = { documentType, countryCode };
  }
}

/**
 * Invalid document error
 */
export class InvalidDocumentError extends RouteError {
  public details?: { documentType?: string; countryCode?: string };

  public constructor(message?: string, details?: { documentType?: string; countryCode?: string }) {
    super(
      HttpStatusCodes.BAD_REQUEST,
      message || 'Documento inválido'
    );
    this.details = details;
  }
}

/**
 * Missing required fields error
 */
export class MissingRequiredFieldsError extends RouteError {
  public missingFields: string[];

  public constructor(missingFields: string[]) {
    super(
      HttpStatusCodes.BAD_REQUEST,
      'Campos obrigatórios faltando'
    );
    this.missingFields = missingFields;
  }
}

/**
 * Weak password error
 */
export class WeakPasswordError extends RouteError {
  public constructor() {
    super(
      HttpStatusCodes.BAD_REQUEST,
      'A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais'
    );
  }
}

/**
 * Email not verified error
 */
export class EmailNotVerifiedError extends RouteError {
  public constructor() {
    super(
      HttpStatusCodes.BAD_REQUEST,
      'Email não verificado. Por favor, verifique seu email antes de finalizar o cadastro'
    );
  }
}

/**
 * Phone not verified error
 */
export class PhoneNotVerifiedError extends RouteError {
  public constructor() {
    super(
      HttpStatusCodes.BAD_REQUEST,
      'Telefone não verificado. Por favor, verifique seu telefone antes de finalizar o cadastro'
    );
  }
}
