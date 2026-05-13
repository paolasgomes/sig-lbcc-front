export function onlyDigits(value?: string | null, maxLength?: number) {
  if (!value) return "";

  const digits = value.replace(/\D/g, "");

  return typeof maxLength === "number" ? digits.slice(0, maxLength) : digits;
}

export function formatCpf(value: string) {
  const digits = onlyDigits(value, 11);

  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
}

export function formatCnpj(value: string) {
  const digits = onlyDigits(value, 14);

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
}

export function formatPhone(value: string) {
  const digits = onlyDigits(value, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
}

export function formatCep(value: string) {
  const digits = onlyDigits(value, 8);

  return digits.replace(/^(\d{5})(\d)/, "$1-$2").replace(/(-\d{3})\d+?$/, "$1");
}

export function toDateInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.split("T")[0].slice(0, 10);
}

export function toDateTimeLocalValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 16);
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);

  return localDate.toISOString().slice(0, 16);
}
