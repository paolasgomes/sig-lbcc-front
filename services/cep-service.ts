import axios from "axios";

export interface CepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
}

export interface CepData {
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
}

const VIACEP_API = "https://viacep.com.br/ws";

/**
 * Busca dados de endereço a partir de um CEP
 * @param cep CEP sem formatação (apenas dígitos)
 * @returns Dados do endereço ou null se não encontrado
 */
export async function fetchCepData(cep: string): Promise<CepData | null> {
  try {
    // Remove caracteres não numéricos
    const cleanCep = cep.replace(/\D/g, "");

    // Valida se tem 8 dígitos
    if (cleanCep.length !== 8) {
      throw new Error("CEP deve conter exatamente 8 dígitos");
    }

    // Formata para a API: XXXXX-XXX
    const formattedCep = `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`;

    const response = await axios.get<CepResponse>(`${VIACEP_API}/${formattedCep}/json`);

    // ViaCEP retorna um objeto com "erro: true" quando CEP não é encontrado
    if ("erro" in response.data && response.data.erro) {
      return null;
    }

    return {
      logradouro: response.data.logradouro || "",
      bairro: response.data.bairro || "",
      cidade: response.data.localidade || "",
      estado: response.data.uf || "",
    };
  } catch (error) {
    // Se for erro de rede ou timeout, relança como erro desconhecido
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED" || !error.response) {
        throw new Error(
          "Não foi possível conectar ao serviço de CEP. Tente novamente mais tarde.",
        );
      }
    }
    throw error;
  }
}
