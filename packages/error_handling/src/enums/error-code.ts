export enum ErrorCode {
  // =========================
  // Domain Errors
  // =========================

  SUBMISSION_NOT_FOUND =
    "SUBMISSION_NOT_FOUND",

  INVALID_TRANSITION =
    "INVALID_TRANSITION",
  
  RESOURCE_NOT_FOUND =
     "RESOURCE_NOT_FOUND",

  // =========================
  // Validation Errors
  // =========================

  VALIDATION_ERROR =
    "VALIDATION_ERROR",

  INVALID_REQUEST_BODY =
    "INVALID_REQUEST_BODY",

  INVALID_INPUT =
    "INVALID_INPUT",

  // =========================
  // Application Errors
  // =========================

  APPLICATION_ERROR =
    "APPLICATION_ERROR",

  EXECUTION_FAILED =
    "EXECUTION_FAILED",

  UNSUPPORTED_LANGUAGE =
    "UNSUPPORTED_LANGUAGE",

  // =========================
  // Infrastructure Errors
  // =========================

  INFRASTRUCTURE_ERROR =
    "INFRASTRUCTURE_ERROR",

  DATABASE_ERROR =
    "DATABASE_ERROR",

  DATABASE_CONNECTION_ERROR =
    "DATABASE_CONNECTION_ERROR",

  QUEUE_ERROR =
    "QUEUE_ERROR",

  QUEUE_CONNECTION_ERROR =
    "QUEUE_CONNECTION_ERROR",

  // =========================
  // Authentication Errors
  // =========================

  AUTHENTICATION_ERROR =
    "AUTHENTICATION_ERROR",

  INVALID_TOKEN =
    "INVALID_TOKEN",

  TOKEN_EXPIRED =
    "TOKEN_EXPIRED",

  // =========================
  // Authorization Errors
  // =========================

  AUTHORIZATION_ERROR =
    "AUTHORIZATION_ERROR",

  ACCESS_DENIED =
    "ACCESS_DENIED",

  // =========================
  // External Service Errors
  // =========================

  EXTERNAL_SERVICE_ERROR =
    "EXTERNAL_SERVICE_ERROR",

  // =========================
  // Generic Errors
  // =========================

  INTERNAL_ERROR =
    "INTERNAL_ERROR",

  UNKNOWN_ERROR =
    "UNKNOWN_ERROR",
}