import { describe, it, expect } from "vitest";
import {
  mapApiFornecedorToFornecedor,
  mapFornecedorCreateToApi,
  mapFornecedorUpdateToApi,
} from "./fornecedores-service";

describe("mapApiFornecedorToFornecedor", () => {
  it("maps snake_case dto to camelCase fornecedor", () => {
    expect(
      mapApiFornecedorToFornecedor({
        id: "uuid-1",
        razao_social: "ACME LTDA",
        nome_fantasia: "ACME",
        cnpj: "12345678000199",
        telefone: "43999999999",
        email: "contato@acme.com",
        ativo: true,
        fornecedorTemVinculos: true,
      }),
    ).toEqual({
      id: "uuid-1",
      razaoSocial: "ACME LTDA",
      nomeFantasia: "ACME",
      cnpj: "12345678000199",
      telefone: "43999999999",
      email: "contato@acme.com",
      ativo: true,
      fornecedorTemVinculos: true,
    });
  });

  it("defaults ativo to true and omits optional fields", () => {
    expect(
      mapApiFornecedorToFornecedor({
        id: "uuid-2",
        razao_social: "Solo Razão",
      }),
    ).toEqual({
      id: "uuid-2",
      razaoSocial: "Solo Razão",
      ativo: true,
    });
  });
});

describe("mapFornecedorCreateToApi", () => {
  it("maps camelCase create input to snake_case", () => {
    expect(
      mapFornecedorCreateToApi({
        razaoSocial: "Empresa X",
        nomeFantasia: "X",
        cnpj: "12345678000199",
        telefone: "43999999999",
        email: "x@email.com",
        ativo: false,
      }),
    ).toEqual({
      razao_social: "Empresa X",
      nome_fantasia: "X",
      cnpj: "12345678000199",
      telefone: "43999999999",
      email: "x@email.com",
      ativo: false,
    });
  });
});

describe("mapFornecedorUpdateToApi", () => {
  it("maps only editable update fields", () => {
    expect(
      mapFornecedorUpdateToApi({
        nomeFantasia: "Novo Nome",
        telefone: "43988888888",
        email: "novo@email.com",
      }),
    ).toEqual({
      nome_fantasia: "Novo Nome",
      telefone: "43988888888",
      email: "novo@email.com",
    });
  });
});
