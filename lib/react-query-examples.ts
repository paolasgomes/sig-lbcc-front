/**
 * Exemplos de uso do React Query no projeto
 *
 * Este arquivo documenta como usar useQuery e useMutation com React Query
 * no contexto do projeto SIG-LBCC.
 */

/**
 * EXEMPLO 1: Usando useQuery para buscar dados
 * 
 * import { useQuery } from '@tanstack/react-query';
 * import { pacientesService } from '@/services/pacientes-service';
 * 
 * export function PacientesList() {
 *   const { data, isLoading, error } = useQuery({
 *     queryKey: ['pacientes'],
 *     queryFn: () => pacientesService.list(),
 *   });
 * 
 *   if (isLoading) return <div>Carregando...</div>;
 *   if (error) return <div>Erro ao carregar pacientes</div>;
 * 
 *   return (
 *     <div>
 *       {data?.map((paciente) => (
 *         <div key={paciente.id}>{paciente.name}</div>
 *       ))}
 *     </div>
 *   );
 * }
 */

/**
 * EXEMPLO 2: Usando useQuery com parâmetros dinâmicos
 * 
 * import { useQuery } from '@tanstack/react-query';
 * import { pacientesService } from '@/services/pacientes-service';
 * 
 * export function PacienteDetail({ id }: { id: string }) {
 *   const { data, isLoading, error } = useQuery({
 *     queryKey: ['pacientes', id],
 *     queryFn: () => pacientesService.getById(id),
 *     enabled: !!id, // Só faz a requisição se id está definido
 *   });
 * 
 *   if (isLoading) return <div>Carregando...</div>;
 *   if (error) return <div>Erro ao carregar paciente</div>;
 * 
 *   return <div>{data?.name}</div>;
 * }
 */

/**
 * EXEMPLO 3: Usando useMutation para criar/atualizar dados
 * 
 * import { useMutation, useQueryClient } from '@tanstack/react-query';
 * import { pacientesService } from '@/services/pacientes-service';
 * import { toast } from 'sonner';
 * 
 * export function CreatePacienteForm() {
 *   const queryClient = useQueryClient();
 *   
 *   const { mutate, isPending } = useMutation({
 *     mutationFn: (data) => pacientesService.create(data),
 *     onSuccess: () => {
 *       // Invalidar a query para refazer a busca
 *       queryClient.invalidateQueries({ queryKey: ['pacientes'] });
 *       toast.success('Paciente criado com sucesso!');
 *     },
 *     onError: (error) => {
 *       toast.error('Erro ao criar paciente');
 *     },
 *   });
 * 
 *   const handleSubmit = async (formData) => {
 *     mutate(formData);
 *   };
 * 
 *   return (
 *     <form onSubmit={(e) => {
 *       e.preventDefault();
 *       handleSubmit(new FormData(e.currentTarget));
 *     }}>
 *       {/* form fields */}
 *       <button type="submit" disabled={isPending}>
 *         {isPending ? 'Salvando...' : 'Salvar'}
 *       </button>
 *     </form>
 *   );
 * }
 */

/**
 * EXEMPLO 4: Usando useMutation para atualizar dados
 * 
 * import { useMutation, useQueryClient } from '@tanstack/react-query';
 * import { pacientesService } from '@/services/pacientes-service';
 * import { toast } from 'sonner';
 * 
 * export function UpdatePacienteForm({ id }: { id: string }) {
 *   const queryClient = useQueryClient();
 *   
 *   const { mutate, isPending } = useMutation({
 *     mutationFn: (data) => pacientesService.update(id, data),
 *     onSuccess: () => {
 *       // Invalidar queries relacionadas
 *       queryClient.invalidateQueries({ queryKey: ['pacientes'] });
 *       queryClient.invalidateQueries({ queryKey: ['pacientes', id] });
 *       toast.success('Paciente atualizado com sucesso!');
 *     },
 *     onError: (error) => {
 *       toast.error('Erro ao atualizar paciente');
 *     },
 *   });
 * 
 *   return (
 *     <form onSubmit={(e) => {
 *       e.preventDefault();
 *       // formData processing
 *       mutate(formData);
 *     }}>
 *       {/* form fields */}
 *     </form>
 *   );
 * }
 */

/**
 * EXEMPLO 5: Usando useMutation para deletar dados
 * 
 * import { useMutation, useQueryClient } from '@tanstack/react-query';
 * import { pacientesService } from '@/services/pacientes-service';
 * import { toast } from 'sonner';
 * 
 * export function DeletePacienteButton({ id }: { id: string }) {
 *   const queryClient = useQueryClient();
 *   
 *   const { mutate, isPending } = useMutation({
 *     mutationFn: () => pacientesService.delete(id),
 *     onSuccess: () => {
 *       queryClient.invalidateQueries({ queryKey: ['pacientes'] });
 *       toast.success('Paciente deletado com sucesso!');
 *     },
 *     onError: (error) => {
 *       toast.error('Erro ao deletar paciente');
 *     },
 *   });
 * 
 *   return (
 *     <button onClick={() => mutate()} disabled={isPending}>
 *       {isPending ? 'Deletando...' : 'Deletar'}
 *     </button>
 *   );
 * }
 */

/**
 * EXEMPLO 6: Configuração padrão de cache e retry
 * 
 * A configuração padrão em lib/react-query.ts inclui:
 * - staleTime: 5 minutos (dados são considerados "fresco" por 5 min)
 * - gcTime: 10 minutos (dados em cache são mantidos por 10 min)
 * - retry: 1 (retenta uma vez em caso de erro)
 * - refetchOnWindowFocus: false (não refaz busca ao voltar para a aba)
 * - refetchOnReconnect: 'stale' (refaz busca se reconectar com dados "velhos")
 * 
 * Para customizar por query:
 * 
 * const { data } = useQuery({
 *   queryKey: ['pacientes'],
 *   queryFn: () => pacientesService.list(),
 *   staleTime: 1000 * 60 * 30, // 30 minutos para esta query específica
 *   retry: 3, // 3 tentativas para esta query
 * });
 */

/**
 * EXEMPLO 7: Invalidating multiple queries
 * 
 * import { useQueryClient } from '@tanstack/react-query';
 * 
 * const queryClient = useQueryClient();
 * 
 * // Invalidar uma query específica
 * queryClient.invalidateQueries({ queryKey: ['pacientes', id] });
 * 
 * // Invalidar todas as queries que começam com 'pacientes'
 * queryClient.invalidateQueries({ queryKey: ['pacientes'] });
 * 
 * // Invalidar múltiplas queries
 * Promise.all([
 *   queryClient.invalidateQueries({ queryKey: ['pacientes'] }),
 *   queryClient.invalidateQueries({ queryKey: ['fornecedores'] }),
 * ]);
 */

export const REACT_QUERY_EXAMPLES = {
  note: 'Consulte os exemplos acima para uso do React Query no projeto',
};
