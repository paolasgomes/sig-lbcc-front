import axios from "axios";

interface ApiErrorResponse {
  error?: unknown;
  message?: unknown;
  detail?: unknown;
  details?: unknown;
  title?: unknown;
  errors?: unknown;
}

function asMessage(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const messages = value
      .map((entry) => (typeof entry === "string" ? entry : null))
      .filter(Boolean);

    return messages.length > 0 ? messages.join(" ") : null;
  }

  return null;
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function mapKnownMessage(message: string, fallback: string) {
  const normalized = normalize(message);

  if (
    normalized.includes("foreign key") ||
    normalized.includes("vinculad") ||
    normalized.includes("em uso") ||
    normalized.includes("ja esta sendo usado") ||
    normalized.includes("ja utilizado") ||
    normalized.includes("referenc") ||
    normalized.includes("dependent") ||
    normalized.includes("constraint")
  ) {
    return "Este registro não pode ser excluído porque já está sendo usado em outro cadastro.";
  }

  if (
    normalized.includes("duplicate") ||
    normalized.includes("already exists") ||
    normalized.includes("unique") ||
    normalized.includes("ja existe") ||
    normalized.includes("ja cadastrado") ||
    normalized.includes("ja registrado") ||
    normalized.includes("violacao")
  ) {
    if (normalized.includes("cpf")) {
      return "Já existe um cadastro com este CPF.";
    }

    if (normalized.includes("cnpj")) {
      return "Já existe um cadastro com este CNPJ.";
    }

    if (normalized.includes("email") || normalized.includes("e-mail")) {
      return "Já existe um cadastro com este e-mail.";
    }

    return "Já existe um registro com os mesmos dados informados.";
  }

  if (
    normalized.includes("obrigator") ||
    normalized.includes("required") ||
    normalized.includes("invalid") ||
    normalized.includes("inval") ||
    normalized.includes("validation") ||
    normalized.includes("formato")
  ) {
    return "Verifique os campos obrigatórios e o formato informado.";
  }

  if (normalized.includes("not found") || normalized.includes("nao encontrado")) {
    return "O registro solicitado não foi encontrado.";
  }

  return message || fallback;
}

export function getFriendlyApiError(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const response = error.response;
    const candidate =
      asMessage(response?.data?.error) ??
      asMessage(response?.data?.message) ??
      asMessage(response?.data?.detail) ??
      asMessage(response?.data?.details) ??
      asMessage(response?.data?.title) ??
      asMessage(response?.data?.errors);

    if (candidate) {
      return mapKnownMessage(candidate, fallback);
    }

    if (response?.status === 409) {
      return mapKnownMessage("duplicate", fallback);
    }

    if (response?.status === 422 || response?.status === 400) {
      return "Verifique os campos obrigatórios e o formato informado.";
    }

    return fallback;
  }

  if (error instanceof Error && error.message) {
    return mapKnownMessage(error.message, fallback);
  }

  return fallback;
}
