import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Perfil.css';
import fotoBob from '../assets/fotoBob.jpeg';
import fotoMila from '../assets/fotoMila.jpg';
import iconePerfilAvalia from '../assets/iconePerfilAvalia.png';
import iconeCalendarioPreto from '../assets/iconeCalendarioPreto.png';
import iconeNotificacao from '../assets/iconeNotificacao.png';
import perfilLogado from '../assets/perfilLogado.png';
import iconeConfirmar from '../assets/iconeConfirmar.png';

const Perfil = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('perfil');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalPet, setModalPet] = useState(null);
  const [isEditingPet, setIsEditingPet] = useState(false);
  const [petEditData, setPetEditData] = useState(null);
  const [petFotoPreview, setPetFotoPreview] = useState(null);
  const [isSavingPet, setIsSavingPet] = useState(false);
  const [isDeletingPet, setIsDeletingPet] = useState(false);

  const [notificacoes, setNotificacoes] = useState({
    emailAgendamento: true,
    smsLembrete: true,
    pushEmergencia: true,
    whatsappConfirmacao: true,
    emailsPromocionais: false
  });

  useEffect(() => {
    // Verifica se tem # na URL para ativar a aba correta
    if (location.hash === '#pagamento') {
      setActiveTab('pagamento');
    }
  }, [location]);

  // Buscar dados do usuário logado
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }

        // Primeiro, tenta obter o ID do tutor do localStorage 'user' (salvo no login)
        let tutorId = null;
        const userFromStorage = localStorage.getItem('user');
        
        if (userFromStorage) {
          try {
            const user = JSON.parse(userFromStorage);
            // Tenta diferentes campos possíveis para o ID
            tutorId = user.idTutor || user.id || user.userId || localStorage.getItem('userId');
            if (tutorId) {
              localStorage.setItem('userId', tutorId.toString());
            }
          } catch (e) {
            console.error('Erro ao parsear user do localStorage:', e);
          }
        }
        
        // Se não encontrou no user, tenta do userId direto
        if (!tutorId) {
          tutorId = localStorage.getItem('userId');
        }

        if (!tutorId) {
          throw new Error('ID do tutor não encontrado. Faça login novamente.');
        }

        // Busca os dados completos do tutor pela API
        const url = `/api/Tutors/id/${tutorId}`;

        console.log('Fazendo requisição para:', url);
        console.log('Tutor ID:', tutorId);
        console.log('Token presente:', !!token);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          // Tentar obter mais detalhes do erro
          let errorDetails = '';
          try {
            const errorData = await response.text();
            errorDetails = errorData;
            console.error('Resposta de erro do servidor:', errorData);
          } catch (e) {
            console.error('Não foi possível ler resposta de erro');
          }
          
          if (response.status === 404) {
            throw new Error(`Tutor com ID ${tutorId} não encontrado. Verifique se o ID está correto ou faça login novamente.`);
          } else if (response.status === 401) {
            throw new Error('Token de autenticação inválido ou expirado. Faça login novamente.');
          } else {
            throw new Error(`Erro ao buscar dados: ${response.status}${errorDetails ? ` - ${errorDetails}` : ''}`);
          }
        }

        const tutorData = await response.json();
        
        console.log('=== DADOS RECEBIDOS DO BACKEND ===');
        console.log('Dados completos do tutor:', tutorData);
        console.log('fotoTutor do backend:', tutorData.fotoTutor ? `${tutorData.fotoTutor.substring(0, 50)}... (${tutorData.fotoTutor.length} caracteres)` : 'null/vazio');
        console.log('Tipo de fotoTutor:', typeof tutorData.fotoTutor);
        console.log('Pets recebidos:', tutorData.pets || tutorData.Pets || []);
        
        // Usar pets que já vêm no tutorData (GetTutor já retorna os pets)
        let petsDoTutor = tutorData.pets || tutorData.Pets || [];
        
        console.log('=== PETS DO TUTOR ===');
        console.log('tutorData completo:', tutorData);
        console.log('tutorData.pets:', tutorData.pets);
        console.log('tutorData.Pets:', tutorData.Pets);
        console.log('Pets recebidos (petsDoTutor):', petsDoTutor);
        console.log('Tipo:', Array.isArray(petsDoTutor) ? 'Array' : typeof petsDoTutor);
        console.log('Quantidade:', Array.isArray(petsDoTutor) ? petsDoTutor.length : 'Não é array');
        
        // Verificar se é um array esparso ou se tem elementos
        if (Array.isArray(petsDoTutor)) {
          console.log('É array, verificando conteúdo...');
          console.log('Keys do array:', Object.keys(petsDoTutor));
          console.log('Primeiro elemento:', petsDoTutor[0]);
          console.log('Array completo (JSON):', JSON.stringify(petsDoTutor));
        }
        
        // Se não vieram pets no tutorData, tentar buscar separadamente (fallback)
        if ((!petsDoTutor || petsDoTutor.length === 0) && (tutorData.idTutor || tutorData.id)) {
          const tutorIdParaPets = parseInt(tutorData.idTutor || tutorData.id);
          if (!isNaN(tutorIdParaPets) && tutorIdParaPets > 0) {
            console.log('⚠️ Pets não vieram no tutorData, tentando buscar separadamente...');
            try {
              const url = `/api/Pets/tutor/${tutorIdParaPets}`;
              const petsResponse = await fetch(url, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

              if (petsResponse.status === 200) {
                try {
                  const petsBuscados = await petsResponse.json();
                  petsDoTutor = Array.isArray(petsBuscados) ? petsBuscados : (petsBuscados ? [petsBuscados] : []);
                  console.log('✅ Pets buscados separadamente com sucesso:', petsDoTutor.length);
                } catch (jsonError) {
                  console.warn('⚠️ Erro ao ler resposta de pets:', jsonError.message);
                }
              }
            } catch (petsError) {
              console.warn('⚠️ Erro ao buscar pets separadamente:', petsError.message);
              // Continuar sem quebrar
            }
          }
        }
        
        // Garantir que seja sempre um array válido (não esparso)
        if (!Array.isArray(petsDoTutor)) {
          petsDoTutor = petsDoTutor ? [petsDoTutor] : [];
        } else {
          // Se for array, filtrar elementos nulos/undefined e garantir que não seja esparso
          petsDoTutor = petsDoTutor.filter(p => p != null && p !== undefined);
        }
        
        console.log('Pets finais que serão usados:', petsDoTutor);
        console.log('Quantidade final de pets:', petsDoTutor.length);
        console.log('Pets finais (JSON):', JSON.stringify(petsDoTutor));
        
        // Mapeia os dados da API para o formato esperado pelo componente
        const mappedData = {
          id: tutorData.idTutor || tutorData.id,
          nome: tutorData.ncTutor || tutorData.nome,
          genero: tutorData.gTutor || tutorData.genero,
          cpf: tutorData.cpfTutor || tutorData.cpf,
          email: tutorData.emailTutor || tutorData.email,
          dataNascimento: tutorData.dnTutor || tutorData.dataNascimento,
          telefone: tutorData.fkNumTtutorNumTtutorPkNavigation?.numTtutor1 || 
                   tutorData.fkNumCtutorNumCtutorPkNavigation?.numCtutor1 || 
                   tutorData.telefone,
          endereco: tutorData.fkEndTutorEndTutorPkNavigation,
          pets: petsDoTutor, // Já garantido que é um array válido acima
          foto: tutorData.fotoTutor || tutorData.foto || null
        };
        
        console.log('mappedData.pets:', mappedData.pets);
        console.log('mappedData.pets.length:', mappedData.pets.length);
        console.log('mappedData.pets (JSON):', JSON.stringify(mappedData.pets));
        
        console.log('mappedData.foto:', mappedData.foto ? `${mappedData.foto.substring(0, 50)}... (${mappedData.foto.length} caracteres)` : 'null/vazio');
        
        setUserData(mappedData);
        
        // Processar e carregar foto do tutor
        let fotoProcessada = null;
        if (mappedData.foto && mappedData.foto.trim() !== '' && mappedData.foto !== 'null') {
          const fotoOriginal = mappedData.foto.trim();
          
          // Se a foto é uma data URL (base64 com prefixo), usar diretamente
          if (fotoOriginal.startsWith('data:')) {
            fotoProcessada = fotoOriginal;
            console.log('✅ Foto detectada como data URL');
          } 
          // Se é uma URL completa (http), usar diretamente (compatibilidade)
          else if (fotoOriginal.startsWith('http')) {
            fotoProcessada = fotoOriginal;
            console.log('✅ Foto detectada como URL HTTP');
          }
          // Se é um caminho relativo da API, tentar construir URL (compatibilidade)
          else if (fotoOriginal.startsWith('/api/')) {
            fotoProcessada = `${fotoOriginal}`;
            console.log('✅ Foto detectada como caminho relativo /api/');
          }
          // Verificar se é base64 puro (mesmo que comece com /)
          // Base64 de imagem geralmente começa com /9j/ (JPEG) ou iVBORw0KGgo (PNG) ou R0lGODlh (GIF)
          else {
            // Remove espaços e quebras de linha
            const base64String = fotoOriginal.replace(/\s/g, '');
            
            // Verificar se é base64 válido (caracteres permitidos: A-Z, a-z, 0-9, +, /, =)
            const base64Regex = /^[A-Za-z0-9+/=]+$/;
            
            // Se tem mais de 500 caracteres e parece base64, é provavelmente uma imagem base64
            // Base64 de imagens geralmente tem milhares de caracteres
            if (base64String.length > 500 && base64Regex.test(base64String)) {
              // É base64 puro - adicionar prefixo
              fotoProcessada = `data:image/jpeg;base64,${base64String}`;
              console.log('✅ Foto processada como base64 puro, adicionado prefixo data:image/jpeg;base64,');
              console.log(`   Tamanho do base64: ${base64String.length} caracteres`);
            }
            // Se começa com / mas tem menos de 100 caracteres, pode ser nome de arquivo
            else if (fotoOriginal.startsWith('/') && base64String.length < 100) {
              fotoProcessada = `/api/Tutors/fotos${fotoOriginal}`;
              console.log('✅ Foto detectada como nome de arquivo (caminho curto)');
            }
            // Se não começa com / e tem menos de 100 caracteres, é nome de arquivo
            else if (!fotoOriginal.startsWith('/') && base64String.length < 100) {
              fotoProcessada = `/api/Tutors/fotos/${fotoOriginal}`;
              console.log('✅ Foto detectada como nome de arquivo');
            }
            // Caso padrão: tentar como base64 se passar na validação
            else if (base64Regex.test(base64String) && base64String.length > 100) {
              fotoProcessada = `data:image/jpeg;base64,${base64String}`;
              console.log('✅ Foto processada como base64 (caso padrão)');
            }
            else {
              console.warn('⚠️ Formato de foto não reconhecido, usando como está');
              fotoProcessada = fotoOriginal;
            }
          }
        } else {
          fotoProcessada = perfilLogado;
          console.log('⚠️ Nenhuma foto encontrada no banco, usando foto padrão');
        }
        
        console.log('📸 Foto processada final:', fotoProcessada ? `${fotoProcessada.substring(0, 80)}...` : 'null');
        console.log('📸 fotoPreview será atualizado com:', fotoProcessada === perfilLogado ? 'foto padrão' : 'foto do banco');
        
        setFotoPreview(fotoProcessada);
        
        // Atualizar contexto de autenticação com a foto processada
        if (fotoProcessada && fotoProcessada !== perfilLogado) {
          // Atualizar user no contexto com a foto
          const userAtualizado = {
            ...mappedData,
            foto: fotoProcessada,
            accountType: 'tutor',
            tipo: 'Tutor'
          };
          updateUser(userAtualizado);
          
          // Salvar foto no localStorage para o Header usar
          localStorage.setItem('userFoto', fotoProcessada);
          
          // Disparar evento para o Header atualizar
          window.dispatchEvent(new CustomEvent('userUpdated', { 
            detail: { foto: fotoProcessada } 
          }));
        }
        
        // Salva o ID no localStorage para uso futuro
        if (mappedData.id) {
          localStorage.setItem('userId', mappedData.id.toString());
        }
      } catch (err) {
        setError(err.message);
        console.error('Erro ao buscar dados do usuário:', err);
        console.error('Stack trace:', err.stack);
        
        // Se o erro for 404, limpar dados inválidos do localStorage
        if (err.message.includes('não encontrado') || err.message.includes('404')) {
          console.warn('Tutor não encontrado, limpando dados do localStorage');
          localStorage.removeItem('userId');
          const userFromStorage = localStorage.getItem('user');
          if (userFromStorage) {
            try {
              const user = JSON.parse(userFromStorage);
              delete user.idTutor;
              delete user.id;
              delete user.userId;
              localStorage.setItem('user', JSON.stringify(user));
            } catch (e) {
              console.error('Erro ao limpar dados do user:', e);
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const pets = [
    {
      id: 1,
      nome: 'Bob',
      tipo: 'Cão - Golden Retriever',
      foto: fotoBob,
      dataNascimento: '12/05/2020',
      microchip: '123.456.789',
      raca: 'Golden Retriever',
      sexo: 'Macho',
      porte: 'Grande',
      peso: '14 Kg',
      cor: 'Laranja'
    },
    {
      id: 2,
      nome: 'Mila',
      tipo: 'Gato - SRD',
      foto: fotoMila,
      dataNascimento: '12/05/2020',
      microchip: '123.456.789',
      raca: 'SRD',
      sexo: 'Fêmea',
      porte: 'Pequeno',
      peso: '5 Kg',
      cor: 'Laranja'
    }
  ];

  const historico = [
    {
      id: 1,
      servico: 'Consulta Veterinária',
      detalhes: '08/11/2025 • REX',
      veterinario: 'DR(A). CARLOS MENDES',
      status: 'concluido',
      preco: 'R$ 180,00'
    },
    {
      id: 2,
      servico: 'Vacinação',
      detalhes: '15/11/2025 • LUNA',
      veterinario: 'DR(A). ANA SANTOS',
      status: 'agendado',
      preco: 'R$ 120,00'
    }
  ];

  const handleToggleNotificacao = (key) => {
    setNotificacoes(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Excluir conta do tutor
  const handleDeleteAccount = async () => {
    // Confirmar exclusão
    const confirmMessage = 'Tem certeza que deseja excluir sua conta?\n\nEsta ação não pode ser desfeita e todos os seus dados serão permanentemente removidos.';
    if (!window.confirm(confirmMessage)) {
      return;
    }

    // Segunda confirmação
    const secondConfirm = window.confirm('ATENÇÃO: Esta é sua última chance de cancelar. Deseja realmente excluir sua conta permanentemente?');
    if (!secondConfirm) {
      return;
    }

    setIsDeleting(true);

    try {
      const token = localStorage.getItem('token');
      const tutorId = userData?.id || localStorage.getItem('userId');

      if (!token || !tutorId) {
        throw new Error('Não foi possível identificar sua conta. Faça login novamente.');
      }

      const response = await fetch(`/api/Tutors/${tutorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Conta não encontrada.');
        } else if (response.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        } else {
          const errorData = await response.text();
          throw new Error(`Erro ao excluir conta: ${response.status}${errorData ? ` - ${errorData}` : ''}`);
        }
      }

      // Limpar localStorage ANTES do logout para garantir que tudo seja limpo
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      localStorage.removeItem('userFoto');

      // Fazer logout para limpar o contexto
      logout();

      // Mostrar mensagem de sucesso
      alert('Sua conta foi excluída com sucesso.');

      // Redirecionar para home usando window.location para forçar reload completo
      // Isso garante que o estado da aplicação seja completamente resetado
      window.location.href = '/';
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      alert(error.message || 'Erro ao excluir conta. Tente novamente.');
      setIsDeleting(false);
    }
  };

  // Formatar CPF
  const formatarCPF = (cpf) => {
    if (!cpf) return '';
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length === 11) {
      return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  };

  // Formatar telefone
  const formatarTelefone = (telefone) => {
    if (!telefone) return 'Não informado';
    const telLimpo = telefone.replace(/\D/g, '');
    if (telLimpo.length === 10) {
      return telLimpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (telLimpo.length === 11) {
      return telLimpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
  };

  // Iniciar edição
  const handleEdit = () => {
    setIsEditing(true);
    
    // Garantir que o endereço seja sempre inicializado
    const enderecoAtual = userData.endereco || {};
    
    setEditData({
      nome: userData.nome || '',
      genero: userData.genero || '',
      email: userData.email || '',
      telefone: userData.telefone ? userData.telefone.replace(/\D/g, '') : '',
      endereco: {
        endTutorPk: enderecoAtual.endTutorPk || null, // ID do endereço se existir
        cepTutor: enderecoAtual.cepTutor ? enderecoAtual.cepTutor.replace(/\D/g, '') : '',
        ruaTutor: enderecoAtual.ruaTutor || '',
        numeroRuaTutor: enderecoAtual.numeroRuaTutor || '',
        bairroTutor: enderecoAtual.bairroTutor || '',
        cidadeTutor: enderecoAtual.cidadeTutor || '',
        estadoTutor: enderecoAtual.estadoTutor || '',
        complemento: enderecoAtual.complemento || enderecoAtual.compTutor || '',
        compTutor: enderecoAtual.compTutor || enderecoAtual.complemento || ''
      }
    });
    
    console.log('Dados de edição inicializados:', {
      nome: userData.nome,
      endereco: enderecoAtual,
      editDataEndereco: {
        cepTutor: enderecoAtual.cepTutor ? enderecoAtual.cepTutor.replace(/\D/g, '') : '',
        ruaTutor: enderecoAtual.ruaTutor || '',
        numeroRuaTutor: enderecoAtual.numeroRuaTutor || '',
        bairroTutor: enderecoAtual.bairroTutor || '',
        cidadeTutor: enderecoAtual.cidadeTutor || '',
        estadoTutor: enderecoAtual.estadoTutor || '',
        complemento: enderecoAtual.complemento || ''
      }
    });
  };

  // Cancelar edição
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(null);
    setFotoFile(null);
    setFotoPreview(userData.foto || perfilLogado);
  };

  // Lidar com mudanças nos campos editáveis
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('endereco.')) {
      const field = name.split('.')[1];
      setEditData(prev => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          [field]: value
        }
      }));
    } else if (name === 'telefone') {
      // Telefone já vem formatado, apenas atualiza
      setEditData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setEditData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Lidar com upload de foto
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }
      
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.');
        return;
      }

      setFotoFile(file);
      
      // Criar preview e converter para base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFotoPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Salvar alterações
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      const tutorId = userData.id;

      if (!token || !tutorId) {
        throw new Error('Dados de autenticação não encontrados');
      }

      // Preparar dados para atualização - APENAS campos que foram alterados
      const updateData = {};

      // Comparar e incluir apenas campos alterados
      if (editData.nome !== userData.nome) {
        updateData.ncTutor = editData.nome;
      }
      
      if (editData.genero !== userData.genero) {
        updateData.gTutor = editData.genero;
      }
      
      if (editData.email !== userData.email) {
        updateData.emailTutor = editData.email;
      }

      // Verificar se o telefone foi alterado
      const telOriginal = userData.telefone ? userData.telefone.replace(/\D/g, '') : '';
      const telEditado = editData.telefone ? editData.telefone.replace(/\D/g, '') : '';
      
      // Verificar se o telefone foi alterado
      if (telEditado && telEditado !== telOriginal && (telEditado.length === 10 || telEditado.length === 11)) {
        // Se o telefone original tinha ID, precisamos manter a estrutura
        // Por enquanto, vamos criar/atualizar apenas o número
        updateData.fkNumTtutorNumTtutorPkNavigation = {
          numTtutor1: telEditado
        };
      } else if (telEditado && telEditado.length > 0 && telEditado.length < 10) {
        // Telefone inválido, não incluir
        console.warn('Telefone inválido, não será atualizado');
      }

      // Verificar se o endereço foi alterado
      const enderecoOriginal = userData.endereco || {};
      const cepOriginal = enderecoOriginal.cepTutor ? enderecoOriginal.cepTutor.replace(/\D/g, '') : '';
      const cepEditado = editData.endereco.cepTutor ? editData.endereco.cepTutor.replace(/\D/g, '') : '';
      
      const enderecoAlterado = 
        cepEditado !== cepOriginal ||
        (editData.endereco.ruaTutor || '') !== (enderecoOriginal.ruaTutor || '') ||
        (editData.endereco.numeroRuaTutor || '') !== (enderecoOriginal.numeroRuaTutor || '') ||
        (editData.endereco.bairroTutor || '') !== (enderecoOriginal.bairroTutor || '') ||
        (editData.endereco.cidadeTutor || '') !== (enderecoOriginal.cidadeTutor || '') ||
        (editData.endereco.estadoTutor || '') !== (enderecoOriginal.estadoTutor || '') ||
        (editData.endereco.complemento || '') !== (enderecoOriginal.complemento || '') ||
        (editData.endereco.compTutor || '') !== (enderecoOriginal.compTutor || '');

      // Só incluir endereço se foi REALMENTE alterado E se já existe um endereço (tem ID)
      // Se não tem ID, não enviar endereço vazio (deixar o backend criar quando necessário)
      if (enderecoAlterado && editData.endereco.endTutorPk) {
        const enderecoUpdate = {};
        
        // Incluir ID do endereço para atualização
        enderecoUpdate.endTutorPk = editData.endereco.endTutorPk;
        
        // Incluir TODOS os campos do endereço (mesmo que vazios) para garantir estrutura completa
        enderecoUpdate.cepTutor = cepEditado || enderecoOriginal.cepTutor?.replace(/\D/g, '') || '';
        enderecoUpdate.ruaTutor = (editData.endereco.ruaTutor || enderecoOriginal.ruaTutor || '').trim();
        enderecoUpdate.numeroRuaTutor = (editData.endereco.numeroRuaTutor || enderecoOriginal.numeroRuaTutor || '').trim();
        enderecoUpdate.bairroTutor = (editData.endereco.bairroTutor || enderecoOriginal.bairroTutor || '').trim();
        enderecoUpdate.cidadeTutor = (editData.endereco.cidadeTutor || enderecoOriginal.cidadeTutor || '').trim();
        enderecoUpdate.estadoTutor = (editData.endereco.estadoTutor || enderecoOriginal.estadoTutor || '').trim();
        // Enviar CompTutor (campo do banco) - priorizar compTutor, senão usar complemento
        enderecoUpdate.compTutor = (editData.endereco.compTutor || 
                                   enderecoOriginal.compTutor || 
                                   editData.endereco.complemento || 
                                   enderecoOriginal.complemento || 
                                   '').trim();

        // Incluir o endereço completo
        updateData.fkEndTutorEndTutorPkNavigation = enderecoUpdate;
      }

      // Se tem foto selecionada, converter para base64 e incluir nos dados
      if (fotoFile && fotoPreview) {
        // fotoPreview já está em base64 (data:image/...;base64,...)
        // Remover o prefixo data:image/...;base64, para enviar apenas o base64
        let base64String = fotoPreview;
        if (fotoPreview.includes(',')) {
          base64String = fotoPreview.split(',')[1];
        } else if (!fotoPreview.startsWith('data:')) {
          // Se já é base64 puro, usar diretamente
          base64String = fotoPreview;
        }
        
        // Validar que o base64 não está vazio
        if (base64String && base64String.length > 0) {
          updateData.fotoTutor = base64String;
          console.log('Foto incluída nos dados (tamanho base64):', base64String.length, 'caracteres');
        } else {
          console.warn('Base64 da foto está vazio, não será enviado');
        }
      }

      // Verificar se há algo para atualizar
      const temDadosParaAtualizar = Object.keys(updateData).length > 0;

      // Se não há dados para atualizar
      if (!temDadosParaAtualizar) {
        alert('Nenhuma alteração foi feita.');
        setIsSaving(false);
        return;
      }

      // Log dos dados que serão enviados (para debug)
      // Não logar a foto completa (muito grande), apenas o tamanho
      const logData = { ...updateData };
      if (logData.fotoTutor) {
        logData.fotoTutor = `[Base64 - ${logData.fotoTutor.length} caracteres]`;
      }
      console.log('Dados a serem enviados para atualização:', logData);
      console.log('Tem fotoTutor?', !!updateData.fotoTutor);
      if (updateData.fotoTutor) {
        console.log('Tamanho do base64 da foto:', updateData.fotoTutor.length, 'caracteres');
      }

      // Atualizar dados do tutor
      const response = await fetch(`/api/Tutors/${tutorId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        // Tentar obter detalhes do erro
        let errorMessage = `Erro ao atualizar: ${response.status}`;
        
        try {
          const errorText = await response.text();
          console.error('=== ERRO DA API ===');
          console.error('Status:', response.status);
          console.error('Resposta (texto):', errorText);
          
          try {
            const errorData = JSON.parse(errorText);
            console.error('Erro detalhado da API (JSON):', errorData);
            errorMessage = errorData.message || errorData.title || errorMessage;
            
            // Se tiver erros de validação, mostrar detalhes
            if (errorData.errors) {
              const validationErrors = Object.entries(errorData.errors)
                .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                .join('\n');
              errorMessage = `Erros de validação:\n${validationErrors}`;
            }
          } catch (parseError) {
            // Se não for JSON, usar o texto direto
            errorMessage = errorText || errorMessage;
            console.error('Erro não é JSON, usando texto direto');
          }
        } catch (e) {
          console.error('Erro ao ler resposta:', e);
        }
        
        // Log dos dados enviados (sem a foto completa para não poluir o console)
        const logDataError = { ...updateData };
        if (logDataError.fotoTutor) {
          logDataError.fotoTutor = `[Base64 - ${logDataError.fotoTutor.length} caracteres - ${(logDataError.fotoTutor.length / 1024).toFixed(2)} KB]`;
        }
        console.error('Dados enviados que causaram o erro:', logDataError);
        
        alert(`Erro ao salvar: ${errorMessage}\n\nVerifique o console para mais detalhes.`);
        setIsSaving(false);
        return;
      }

      const updatedTutor = await response.json();

      // Construir URL da foto - se veio do banco como base64, converter para data URL
      let fotoUrlCompleta = null;
      if (fotoFile && fotoPreview) {
        // Se foi enviada uma nova foto, usar o preview (já está em data URL)
        fotoUrlCompleta = fotoPreview;
      } else if (updatedTutor.fotoTutor) {
        // Se a foto veio do banco como base64, construir data URL
        if (updatedTutor.fotoTutor.startsWith('data:')) {
          fotoUrlCompleta = updatedTutor.fotoTutor;
        } else {
          // Assumir que é base64 puro, adicionar prefixo
          fotoUrlCompleta = `data:image/jpeg;base64,${updatedTutor.fotoTutor}`;
        }
      } else {
        // Usar foto atual ou padrão
        fotoUrlCompleta = userData.foto || perfilLogado;
      }

      // Atualizar estado local
      const updatedData = {
        ...userData,
        nome: updatedTutor.ncTutor || editData.nome,
        genero: updatedTutor.gTutor || editData.genero,
        email: updatedTutor.emailTutor || editData.email,
        telefone: editData.telefone ? formatarTelefone(editData.telefone) : userData.telefone,
        endereco: updatedTutor.fkEndTutorEndTutorPkNavigation || editData.endereco,
        foto: fotoUrlCompleta
      };

      setUserData(updatedData);
      setFotoPreview(fotoUrlCompleta);
      
      // Atualizar contexto de autenticação
      const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...userFromStorage,
        nome: updatedData.nome,
        email: updatedData.email,
        foto: fotoUrlCompleta
      };
      updateUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Salvar foto no localStorage para o Header usar
      if (fotoUrlCompleta && fotoUrlCompleta !== perfilLogado) {
        localStorage.setItem('userFoto', fotoUrlCompleta);
      }

      // Disparar evento customizado para atualizar a navbar
      window.dispatchEvent(new CustomEvent('userUpdated', { 
        detail: { foto: fotoUrlCompleta, ...updatedData } 
      }));

      setIsEditing(false);
      setEditData(null);
      setFotoFile(null);
      alert('Perfil atualizado com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar alterações:', err);
      alert(err.message || 'Erro ao salvar alterações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // Função para formatar data
  const formatarData = (data) => {
    if (!data || data === '' || data === 'null') return 'Não informado';
    try {
      // Se for string no formato YYYY-MM-DD
      if (typeof data === 'string' && data.includes('-')) {
        const partes = data.split('-');
        if (partes.length === 3) {
          return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
      }
      // Se for Date object
      if (data instanceof Date) {
      return data.toLocaleDateString('pt-BR');
      }
      return data;
    } catch (e) {
      return data;
    }
  };

  // Função para abrir modal de detalhes do pet
  const handleAbrirModalPet = (pet) => {
    console.log('=== ABRINDO MODAL PARA PET ===');
    console.log('Pet recebido:', pet);
    console.log('NPet:', pet.NPet, 'nPet:', pet.nPet, 'nomePet:', pet.nomePet, 'nome:', pet.nome);
    console.log('EspPet:', pet.EspPet, 'espPet:', pet.espPet, 'especiePet:', pet.especiePet, 'especie:', pet.especie);
    console.log('RacaPet:', pet.RacaPet, 'racaPet:', pet.racaPet, 'raca:', pet.raca);
    console.log('DnPet:', pet.DnPet, 'dnPet:', pet.dnPet, 'dataNascimento:', pet.dataNascimento);
    console.log('CmPet:', pet.CmPet, 'cmPet:', pet.cmPet, 'cmpet:', pet.cmpet, 'microchipPet:', pet.microchipPet, 'microchip:', pet.microchip);
    console.log('SexoPet:', pet.SexoPet, 'sexoPet:', pet.sexoPet, 'sexo:', pet.sexo);
    console.log('PortePet:', pet.PortePet, 'portePet:', pet.portePet, 'porte:', pet.porte);
    console.log('PeqPet:', pet.PeqPet, 'peqPet:', pet.peqPet, 'pesoPet:', pet.pesoPet, 'peso:', pet.peso);
    console.log('CorPet:', pet.CorPet, 'corPet:', pet.corPet, 'cor:', pet.cor);
    console.log('CasPet:', pet.CasPet, 'casPet:', pet.casPet);
    console.log('CpePet:', pet.CpePet, 'cpePet:', pet.cpePet);
    console.log('MaPet:', pet.MaPet, 'maPet:', pet.maPet);
    console.log('FotoPet:', pet.FotoPet || pet.fotoPet || pet.foto ? 'Presente' : 'Ausente');
    setModalPet(pet);
    setIsEditingPet(false);
    setPetEditData(null);
    setPetFotoPreview(null);
  };

  // Função para fechar modal
  const handleFecharModalPet = () => {
    setModalPet(null);
    setIsEditingPet(false);
    setPetEditData(null);
    setPetFotoPreview(null);
  };

  // Função para iniciar edição do pet
  const handleIniciarEdicaoPet = () => {
    if (!modalPet) return;
    
    // Parsear data de nascimento se existir
    let diaNasc = '', mesNasc = '', anoNasc = '';
    if (modalPet.DnPet || modalPet.dnPet || modalPet.dataNascimento) {
      const dataStr = modalPet.DnPet || modalPet.dnPet || modalPet.dataNascimento;
      if (dataStr && dataStr.includes('-')) {
        const partes = dataStr.split('-');
        anoNasc = partes[0];
        mesNasc = partes[1];
        diaNasc = partes[2];
      }
    }

    // Função auxiliar para obter valor considerando todas as variações
    const getEditValue = (...values) => {
      for (const val of values) {
        if (val !== null && val !== undefined && val !== '') {
          return val;
        }
      }
      return '';
    };
    
    setPetEditData({
      NPet: getEditValue(modalPet.NPet, modalPet.nPet, modalPet.nomePet, modalPet.nome),
      EspPet: getEditValue(modalPet.EspPet, modalPet.espPet, modalPet.especiePet, modalPet.especie),
      RacaPet: getEditValue(modalPet.RacaPet, modalPet.racaPet, modalPet.raca),
      diaNascimento: diaNasc,
      mesNascimento: mesNasc,
      anoNascimento: anoNasc,
      CmPet: getEditValue(modalPet.CmPet, modalPet.cmPet, modalPet.cmpet, modalPet.microchipPet, modalPet.microchip),
      SexoPet: getEditValue(modalPet.SexoPet, modalPet.sexoPet, modalPet.sexo) || 'Macho',
      CasPet: (modalPet.CasPet !== undefined ? modalPet.CasPet : (modalPet.casPet !== undefined ? modalPet.casPet : null)),
      PortePet: getEditValue(modalPet.PortePet, modalPet.portePet, modalPet.porte) || 'Pequeno',
      PeqPet: getEditValue(modalPet.PeqPet, modalPet.peqPet, modalPet.pesoPet, modalPet.peso),
      CorPet: getEditValue(modalPet.CorPet, modalPet.corPet, modalPet.cor),
      CpePet: getEditValue(modalPet.CpePet, modalPet.cpePet, modalPet.condicoesPreexistentes),
      MaPet: getEditValue(modalPet.MaPet, modalPet.maPet, modalPet.medicacoesAtuais)
    });

    // Processar foto se existir
    const fotoPet = modalPet.FotoPet || modalPet.fotoPet || modalPet.foto;
    if (fotoPet && fotoPet !== perfilLogado && !fotoPet.startsWith('data:')) {
      // Se for base64 puro, adicionar prefixo
      if (fotoPet.length > 100) {
        setPetFotoPreview(`data:image/jpeg;base64,${fotoPet}`);
      } else {
        setPetFotoPreview(fotoPet);
      }
    } else if (fotoPet && fotoPet.startsWith('data:')) {
      setPetFotoPreview(fotoPet);
    }

    setIsEditingPet(true);
  };

  // Função para salvar edição do pet
  const handleSalvarPet = async () => {
    if (!modalPet || !petEditData) return;

    try {
      setIsSavingPet(true);
      const token = localStorage.getItem('token');
      const petId = modalPet.IdPet || modalPet.idPet || modalPet.id;

      if (!token || !petId) {
        throw new Error('Dados de autenticação não encontrados');
      }

      // Preparar dados para atualização
      const updateData = {};

      if (petEditData.NPet && petEditData.NPet.trim() !== '') {
        updateData.NPet = petEditData.NPet.trim();
      }

      if (petEditData.EspPet && petEditData.EspPet.trim() !== '') {
        updateData.EspPet = petEditData.EspPet.trim();
      }

      if (petEditData.RacaPet && petEditData.RacaPet.trim() !== '') {
        updateData.RacaPet = petEditData.RacaPet.trim();
      }

      // Processar data de nascimento
      // O backend espera uma string no formato "yyyy-MM-dd" no campo DnPetString
      if (petEditData.diaNascimento && petEditData.mesNascimento && petEditData.anoNascimento) {
        const dia = parseInt(petEditData.diaNascimento);
        const mes = parseInt(petEditData.mesNascimento);
        const ano = parseInt(petEditData.anoNascimento);
        
        if (dia && mes && ano && dia > 0 && dia <= 31 && mes > 0 && mes <= 12 && ano > 1900) {
          // Enviar como string no formato "yyyy-MM-dd" para o backend converter para DateOnly
          const dataFormatada = `${ano}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
          updateData.DnPetString = dataFormatada; // Usar DnPetString para enviar como string
        }
      }

      if (petEditData.CmPet !== undefined) {
        updateData.CmPet = petEditData.CmPet.trim() || '';
      }

      if (petEditData.SexoPet) {
        updateData.SexoPet = petEditData.SexoPet;
      }

      if (petEditData.CasPet !== null && petEditData.CasPet !== undefined) {
        updateData.CasPet = petEditData.CasPet;
      }

      if (petEditData.PortePet) {
        updateData.PortePet = petEditData.PortePet;
      }

      if (petEditData.PeqPet !== undefined && petEditData.PeqPet !== '') {
        updateData.PeqPet = parseFloat(petEditData.PeqPet) || null;
      }

      if (petEditData.CorPet !== undefined) {
        updateData.CorPet = petEditData.CorPet.trim() || '';
      }

      if (petEditData.CpePet !== undefined) {
        updateData.CpePet = petEditData.CpePet.trim() || '';
      }

      if (petEditData.MaPet !== undefined) {
        updateData.MaPet = petEditData.MaPet.trim() || '';
      }

      // Processar foto se foi alterada
      if (petFotoPreview && petFotoPreview !== (modalPet.FotoPet || modalPet.fotoPet || modalPet.foto)) {
        let fotoBase64 = petFotoPreview;
        if (fotoBase64.includes(',')) {
          fotoBase64 = fotoBase64.split(',')[1];
        }
        updateData.FotoPet = fotoBase64;
      }

      // Verificar se há dados para atualizar
      if (Object.keys(updateData).length === 0) {
        alert('Nenhuma alteração foi feita.');
        setIsSavingPet(false);
        return;
      }

      console.log('=== ENVIANDO DADOS PARA ATUALIZAR PET ===');
      console.log('Pet ID:', petId);
      console.log('updateData:', updateData);
      console.log('updateData (JSON):', JSON.stringify(updateData));

      // Atualizar pet
      const response = await fetch(`/api/Pets/${petId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao atualizar pet: ${response.status} - ${errorText}`);
      }

      // Recarregar dados do usuário para atualizar a lista de pets
      // Usar a mesma lógica completa da função fetchUserData original
      const tokenReload = localStorage.getItem('token');
      const userId = userData.id;
      
      const tutorResponse = await fetch(`/api/Tutors/id/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenReload}`,
          'Content-Type': 'application/json'
        }
      });

      if (tutorResponse.ok) {
        const tutorData = await tutorResponse.json();
        console.log('=== RECARREGANDO PETS APÓS EDIÇÃO ===');
        console.log('tutorData recebido:', tutorData);
        
        // Usar pets que já vêm no tutorData (GetTutor já retorna os pets)
        let petsDoTutor = tutorData.pets || tutorData.Pets || [];
        
        console.log('Pets recebidos no tutorData:', petsDoTutor);
        console.log('Tipo:', Array.isArray(petsDoTutor) ? 'Array' : typeof petsDoTutor);
        console.log('Quantidade:', Array.isArray(petsDoTutor) ? petsDoTutor.length : 'Não é array');
        
        // Se não vieram pets no tutorData, tentar buscar separadamente (fallback)
        if ((!petsDoTutor || petsDoTutor.length === 0) && (tutorData.idTutor || tutorData.id)) {
          const tutorIdParaPets = parseInt(tutorData.idTutor || tutorData.id);
          if (!isNaN(tutorIdParaPets) && tutorIdParaPets > 0) {
            console.log('⚠️ Pets não vieram no tutorData, tentando buscar separadamente...');
            try {
              const url = `/api/Pets/tutor/${tutorIdParaPets}`;
              const petsResponse = await fetch(url, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${tokenReload}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (petsResponse.status === 200) {
                try {
                  const petsBuscados = await petsResponse.json();
                  petsDoTutor = Array.isArray(petsBuscados) ? petsBuscados : (petsBuscados ? [petsBuscados] : []);
                  console.log('✅ Pets buscados separadamente com sucesso:', petsDoTutor.length);
                } catch (jsonError) {
                  console.warn('⚠️ Erro ao ler resposta de pets:', jsonError.message);
                }
              }
            } catch (petsError) {
              console.warn('⚠️ Erro ao buscar pets separadamente:', petsError.message);
              // Continuar sem quebrar
            }
          }
        }
        
        // Garantir que seja sempre um array válido (não esparso)
        if (!Array.isArray(petsDoTutor)) {
          petsDoTutor = petsDoTutor ? [petsDoTutor] : [];
        } else {
          // Se for array, filtrar elementos nulos/undefined e garantir que não seja esparso
          petsDoTutor = petsDoTutor.filter(p => p != null && p !== undefined);
        }
        
        console.log('Pets finais após edição:', petsDoTutor);
        console.log('Quantidade final de pets:', petsDoTutor.length);
        
        // Encontrar o pet atualizado na lista recarregada
        const petId = modalPet.IdPet || modalPet.idPet || modalPet.id;
        console.log('Buscando pet com ID:', petId);
        console.log('Lista de pets para buscar:', petsDoTutor);
        
        const petAtualizado = petsDoTutor.find(p => {
          const pId = p.IdPet || p.idPet || p.id;
          console.log('Comparando pet ID:', pId, 'com', petId);
          return pId === petId;
        });
        
        console.log('=== PET ATUALIZADO ENCONTRADO ===');
        console.log('Pet encontrado:', petAtualizado);
        if (petAtualizado) {
          console.log('NPet:', petAtualizado.NPet || petAtualizado.nomePet || petAtualizado.nome);
          console.log('EspPet:', petAtualizado.EspPet || petAtualizado.especiePet || petAtualizado.especie);
          console.log('RacaPet:', petAtualizado.RacaPet || petAtualizado.racaPet || petAtualizado.raca);
          console.log('DnPet:', petAtualizado.DnPet || petAtualizado.dnPet || petAtualizado.dataNascimento);
          console.log('CmPet:', petAtualizado.CmPet || petAtualizado.microchipPet || petAtualizado.microchip);
          console.log('SexoPet:', petAtualizado.SexoPet || petAtualizado.sexoPet || petAtualizado.sexo);
          console.log('PortePet:', petAtualizado.PortePet || petAtualizado.portePet || petAtualizado.porte);
          console.log('PeqPet:', petAtualizado.PeqPet || petAtualizado.pesoPet || petAtualizado.peso);
          console.log('CorPet:', petAtualizado.CorPet || petAtualizado.corPet || petAtualizado.cor);
          console.log('CasPet:', petAtualizado.CasPet);
          console.log('CpePet:', petAtualizado.CpePet);
          console.log('MaPet:', petAtualizado.MaPet);
        }
        
        // Atualizar userData com os pets atualizados
        setUserData(prev => ({
          ...prev,
          pets: petsDoTutor
        }));
        
        // Atualizar modalPet com os dados recarregados para que apareçam corretamente
        if (petAtualizado) {
          setModalPet(petAtualizado);
          console.log('✅ modalPet atualizado com dados recarregados');
        } else {
          console.warn('⚠️ Pet atualizado não encontrado na lista recarregada');
        }
        
        console.log('✅ Lista de pets atualizada com sucesso');
      } else {
        console.warn('⚠️ Erro ao recarregar dados do tutor após edição:', tutorResponse.status);
      }

      alert('Pet atualizado com sucesso!');
      setIsEditingPet(false);
      // Não fechar o modal, apenas sair do modo de edição para mostrar os dados atualizados
    } catch (err) {
      console.error('Erro ao salvar pet:', err);
      alert(err.message || 'Erro ao salvar alterações do pet. Tente novamente.');
    } finally {
      setIsSavingPet(false);
    }
  };

  // Função para excluir pet
  const handleExcluirPet = async () => {
    if (!modalPet) return;

    const confirmacao = window.confirm(`Tem certeza que deseja excluir o pet "${modalPet.NPet || modalPet.nomePet || modalPet.nome || 'este pet'}"? Esta ação não pode ser desfeita.`);
    if (!confirmacao) return;

    try {
      setIsDeletingPet(true);
      const token = localStorage.getItem('token');
      const petId = modalPet.IdPet || modalPet.idPet || modalPet.id;

      if (!token || !petId) {
        throw new Error('Dados de autenticação não encontrados');
      }

      const response = await fetch(`/api/Pets/${petId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Pet não encontrado.');
        } else {
          const errorText = await response.text();
          throw new Error(`Erro ao excluir pet: ${response.status}${errorText ? ` - ${errorText}` : ''}`);
        }
      }

      // Recarregar dados do usuário para atualizar a lista de pets
      // Usar a mesma lógica completa da função fetchUserData original
      const tokenReload = localStorage.getItem('token');
      const userId = userData.id;
      
      const tutorResponse = await fetch(`/api/Tutors/id/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenReload}`,
          'Content-Type': 'application/json'
        }
      });

      if (tutorResponse.ok) {
        const tutorData = await tutorResponse.json();
        console.log('=== RECARREGANDO PETS APÓS EXCLUSÃO ===');
        console.log('tutorData recebido:', tutorData);
        
        // Usar pets que já vêm no tutorData (GetTutor já retorna os pets)
        let petsDoTutor = tutorData.pets || tutorData.Pets || [];
        
        console.log('Pets recebidos no tutorData:', petsDoTutor);
        console.log('Tipo:', Array.isArray(petsDoTutor) ? 'Array' : typeof petsDoTutor);
        console.log('Quantidade:', Array.isArray(petsDoTutor) ? petsDoTutor.length : 'Não é array');
        
        // Se não vieram pets no tutorData, tentar buscar separadamente (fallback)
        if ((!petsDoTutor || petsDoTutor.length === 0) && (tutorData.idTutor || tutorData.id)) {
          const tutorIdParaPets = parseInt(tutorData.idTutor || tutorData.id);
          if (!isNaN(tutorIdParaPets) && tutorIdParaPets > 0) {
            console.log('⚠️ Pets não vieram no tutorData, tentando buscar separadamente...');
            try {
              const url = `/api/Pets/tutor/${tutorIdParaPets}`;
              const petsResponse = await fetch(url, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${tokenReload}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (petsResponse.status === 200) {
                try {
                  const petsBuscados = await petsResponse.json();
                  petsDoTutor = Array.isArray(petsBuscados) ? petsBuscados : (petsBuscados ? [petsBuscados] : []);
                  console.log('✅ Pets buscados separadamente com sucesso:', petsDoTutor.length);
                } catch (jsonError) {
                  console.warn('⚠️ Erro ao ler resposta de pets:', jsonError.message);
                }
              }
            } catch (petsError) {
              console.warn('⚠️ Erro ao buscar pets separadamente:', petsError.message);
              // Continuar sem quebrar
            }
          }
        }
        
        // Garantir que seja sempre um array válido (não esparso)
        if (!Array.isArray(petsDoTutor)) {
          petsDoTutor = petsDoTutor ? [petsDoTutor] : [];
        } else {
          // Se for array, filtrar elementos nulos/undefined e garantir que não seja esparso
          petsDoTutor = petsDoTutor.filter(p => p != null && p !== undefined);
        }
        
        console.log('Pets finais após exclusão:', petsDoTutor);
        console.log('Quantidade final de pets:', petsDoTutor.length);
        
        // Atualizar userData com os pets atualizados
        setUserData(prev => ({
          ...prev,
          pets: petsDoTutor
        }));
        
        console.log('✅ Lista de pets atualizada com sucesso');
      } else {
        console.warn('⚠️ Erro ao recarregar dados do tutor após exclusão:', tutorResponse.status);
      }

      alert('Pet excluído com sucesso!');
      handleFecharModalPet();
    } catch (error) {
      console.error('Erro ao excluir pet:', error);
      alert(error.message || 'Erro ao excluir pet. Tente novamente.');
    } finally {
      setIsDeletingPet(false);
    }
  };

  // Função para processar foto do pet
  const handlePetFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPetFotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <section className="configuracoes-page">
        <div className="configuracoes-container">
          <div className="loading">Carregando dados do perfil...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="configuracoes-page">
        <div className="configuracoes-container">
          <div className="error-message">
            <h3>Erro ao carregar perfil</h3>
            <p>{error}</p>
            <br />
            <p>Token: {localStorage.getItem('token') ? 'Presente' : 'Ausente'}</p>
            <p>UserID: {localStorage.getItem('userId') || 'Não salvo'}</p>
            <br />
            <Link to="/login">Fazer login novamente</Link>
          </div>
        </div>
      </section>
    );
  }

  if (!userData) {
    return (
      <section className="configuracoes-page">
        <div className="configuracoes-container">
          <div className="error-message">
            Nenhum dado de usuário encontrado.
            <br />
            <Link to="/login">Fazer login</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="configuracoes-page">
      <div className="configuracoes-container">
        <div className="configuracoes-header">
          <h1 className="configuracoes-titulo">CONFIGURAÇÕES</h1>
          <p className="configuracoes-subtitulo">GERENCIE SUAS INFORMAÇÕES PESSOAIS E PREFERÊNCIAS</p>
        </div>

        <div className="configuracoes-tabs">
          <button
            className={`config-tab ${activeTab === 'perfil' ? 'active' : ''}`}
            onClick={() => setActiveTab('perfil')}
            data-tab="perfil"
          >
            <img src={iconePerfilAvalia} alt="Perfil" />
            <span>PERFIL</span>
          </button>
          <button
            className={`config-tab ${activeTab === 'historico' ? 'active' : ''}`}
            onClick={() => setActiveTab('historico')}
            data-tab="historico"
          >
            <img src={iconeCalendarioPreto} alt="Histórico" />
            <span>HISTÓRICO</span>
          </button>
          <button
            className={`config-tab ${activeTab === 'pagamento' ? 'active' : ''}`}
            onClick={() => setActiveTab('pagamento')}
            data-tab="pagamento"
          >
            <i className="bi bi-credit-card-2-front-fill"></i>
            <span>PAGAMENTO</span>
          </button>
          <button
            className={`config-tab ${activeTab === 'notificacoes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notificacoes')}
            data-tab="notificacoes"
          >
            <img src={iconeNotificacao} alt="Notificações" />
            <span>NOTIFICAÇÕES</span>
          </button>
        </div>

        {/* Conteúdo Perfil */}
        {activeTab === 'perfil' && (
          <div id="perfil-content" className="config-content active">
            <div className="perfil-card">
              <div className="perfil-card-header">
                <div className="perfil-info">
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img 
                      src={fotoPreview || perfilLogado} 
                      alt={userData.nome || 'Usuário'} 
                      className="perfil-foto" 
                    />
                    {isEditing && (
                      <label 
                        htmlFor="foto-upload" 
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          backgroundColor: '#6B46C1',
                          color: 'white',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          border: '2px solid white'
                        }}
                        title="Alterar foto"
                      >
                        <i className="bi bi-camera-fill" style={{ fontSize: '16px' }}></i>
                      </label>
                    )}
                    {isEditing && (
                      <input
                        type="file"
                        id="foto-upload"
                        accept="image/*"
                        onChange={handleFotoChange}
                        style={{ display: 'none' }}
                      />
                    )}
                  </div>
                  <div>
                    <h2 className="perfil-nome">{userData.nome || 'Nome não informado'}</h2>
                    <p className="perfil-tipo">Tutor</p>
                  </div>
                </div>
                {!isEditing ? (
                  <button className="btn-editar-perfil" onClick={handleEdit}>
                  <img src={iconeConfirmar} alt="Editar" />
                  <span>Editar Perfil</span>
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      className="btn-editar-perfil" 
                      onClick={handleSave}
                      disabled={isSaving}
                      style={{ backgroundColor: '#10B981' }}
                    >
                      <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
                    </button>
                    <button 
                      className="btn-editar-perfil" 
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      style={{ backgroundColor: '#EF4444' }}
                    >
                      <span>Cancelar</span>
                </button>
                  </div>
                )}
              </div>
              <div className="perfil-card-body">
                <div className="perfil-grid">
                  <div className="perfil-campo">
                    <label>Nome Completo</label>
                    <input 
                      type="text" 
                      value={isEditing ? (editData?.nome || '') : (userData.nome || '')} 
                      readOnly={!isEditing}
                      onChange={isEditing ? handleEditChange : undefined}
                      name="nome"
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="perfil-campo">
                    <label>Gênero</label>
                    <select 
                      disabled={!isEditing} 
                      value={isEditing ? (editData?.genero || '') : (userData.genero || '')}
                      onChange={isEditing ? handleEditChange : undefined}
                      name="genero"
                    >
                      <option value="">Selecione</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Outro">Outro</option>
                      <option value="Prefiro não informar">Prefiro não informar</option>
                    </select>
                  </div>
                  <div className="perfil-campo">
                    <label>CPF</label>
                    <input 
                      type="text" 
                      value={formatarCPF(userData.cpf)} 
                      readOnly 
                    />
                  </div>
                  <div className="perfil-campo">
                    <label>Email</label>
                    <input 
                      type="email" 
                      value={isEditing ? (editData?.email || '') : (userData.email || '')} 
                      readOnly={!isEditing}
                      onChange={isEditing ? handleEditChange : undefined}
                      name="email"
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="perfil-campo">
                    <label>Data de Nascimento</label>
                    <input 
                      type="text" 
                      value={formatarData(userData.dataNascimento)} 
                      readOnly 
                    />
                  </div>
                  <div className="perfil-campo">
                    <label>Telefone</label>
                    <input 
                      type="text" 
                      value={isEditing ? (editData?.telefone ? formatarTelefone(editData.telefone) : '') : formatarTelefone(userData.telefone)} 
                      readOnly={!isEditing}
                      onChange={isEditing ? (e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        handleEditChange({ target: { name: 'telefone', value } });
                      } : undefined}
                      name="telefone"
                      disabled={!isEditing}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  {/* Sempre mostrar campos de endereço */}
                  <>
                    <div className="perfil-campo">
                      <label>CEP</label>
                      <input 
                        type="text" 
                        value={isEditing ? (editData?.endereco?.cepTutor ? (editData.endereco.cepTutor.length === 8 ? editData.endereco.cepTutor.replace(/(\d{5})(\d{3})/, '$1-$2') : editData.endereco.cepTutor) : '') : (userData.endereco?.cepTutor ? (userData.endereco.cepTutor.length === 8 ? userData.endereco.cepTutor.replace(/(\d{5})(\d{3})/, '$1-$2') : userData.endereco.cepTutor.replace(/(\d{5})(\d{3})/, '$1-$2')) : '')} 
                        readOnly={!isEditing}
                        onChange={isEditing ? (e) => {
                          const value = e.target.value.replace(/\D/g, '').substring(0, 8);
                          handleEditChange({ target: { name: 'endereco.cepTutor', value } });
                        } : undefined}
                        name="endereco.cepTutor"
                        disabled={!isEditing}
                        placeholder="00000-000"
                      />
                </div>
                    <div className="perfil-campo">
                      <label>Rua</label>
                      <input 
                        type="text" 
                        value={isEditing ? (editData?.endereco?.ruaTutor || '') : (userData.endereco?.ruaTutor || '')} 
                        readOnly={!isEditing}
                        onChange={isEditing ? handleEditChange : undefined}
                        name="endereco.ruaTutor"
                        disabled={!isEditing}
                        placeholder="Nome da rua"
                      />
                    </div>
                    <div className="perfil-campo">
                      <label>Número</label>
                      <input 
                        type="text" 
                        value={isEditing ? (editData?.endereco?.numeroRuaTutor || '') : (userData.endereco?.numeroRuaTutor || '')} 
                        readOnly={!isEditing}
                        onChange={isEditing ? handleEditChange : undefined}
                        name="endereco.numeroRuaTutor"
                        disabled={!isEditing}
                        placeholder="Número"
                      />
                    </div>
                    <div className="perfil-campo">
                      <label>Bairro</label>
                      <input 
                        type="text" 
                        value={isEditing ? (editData?.endereco?.bairroTutor || '') : (userData.endereco?.bairroTutor || '')} 
                        readOnly={!isEditing}
                        onChange={isEditing ? handleEditChange : undefined}
                        name="endereco.bairroTutor"
                        disabled={!isEditing}
                        placeholder="Nome do bairro"
                      />
                    </div>
                    <div className="perfil-campo">
                      <label>Cidade</label>
                      <input 
                        type="text" 
                        value={isEditing ? (editData?.endereco?.cidadeTutor || '') : (userData.endereco?.cidadeTutor || '')} 
                        readOnly={!isEditing}
                        onChange={isEditing ? handleEditChange : undefined}
                        name="endereco.cidadeTutor"
                        disabled={!isEditing}
                        placeholder="Nome da cidade"
                      />
                    </div>
                    <div className="perfil-campo">
                      <label>Estado</label>
                      <input 
                        type="text" 
                        value={isEditing ? (editData?.endereco?.estadoTutor || '') : (userData.endereco?.estadoTutor || '')} 
                        readOnly={!isEditing}
                        onChange={isEditing ? handleEditChange : undefined}
                        name="endereco.estadoTutor"
                        disabled={!isEditing}
                        placeholder="UF"
                        maxLength={2}
                      />
                    </div>
                    <div className="perfil-campo">
                      <label>Complemento</label>
                      <input 
                        type="text" 
                        value={isEditing ? (editData?.endereco?.complemento || '') : (userData.endereco?.complemento || '')} 
                        readOnly={!isEditing}
                        onChange={isEditing ? handleEditChange : undefined}
                        name="endereco.complemento"
                        disabled={!isEditing}
                        placeholder="Complemento (opcional)"
                      />
                    </div>
                  </>
                </div>
              </div>
            </div>

            <div className="pets-section">
              <div className="pets-section-header">
                <div>
                  <h2 className="pets-section-titulo">MEU(S) PET(S)</h2>
                  <p className="pets-section-subtitulo">GERENCIE AS INFORMAÇÕES DOS SEUS COMPANHEIROS</p>
                </div>
                <Link to="/cadastro-pet" className="btn-cadastrar-pet" style={{textDecoration: 'none', display: 'inline-flex'}}>
                  <span>+</span>
                  <span>Cadastrar Pet</span>
                </Link>
              </div>

              <div className="pets-grid">
                {userData.pets && Array.isArray(userData.pets) && userData.pets.length > 0 ? (
                  userData.pets.map(pet => {
                    console.log('=== RENDERIZANDO PET ===');
                    console.log('Pet completo:', pet);
                    console.log('NPet:', pet.NPet, 'nPet:', pet.nPet, '(tipo NPet:', typeof pet.NPet, ', tipo nPet:', typeof pet.nPet, ')');
                    console.log('EspPet:', pet.EspPet, 'espPet:', pet.espPet, '(tipo EspPet:', typeof pet.EspPet, ', tipo espPet:', typeof pet.espPet, ')');
                    console.log('RacaPet:', pet.RacaPet, 'racaPet:', pet.racaPet, '(tipo RacaPet:', typeof pet.RacaPet, ', tipo racaPet:', typeof pet.racaPet, ')');
                    console.log('CmPet:', pet.CmPet, 'cmPet:', pet.cmPet, 'cmpet:', pet.cmpet);
                    console.log('PeqPet:', pet.PeqPet, 'peqPet:', pet.peqPet);
                    
                    // Função auxiliar para obter valor do campo, tratando null, undefined e strings vazias
                    const getPetValue = (...values) => {
                      for (const val of values) {
                        if (val !== null && val !== undefined && val !== '') {
                          if (typeof val === 'string' && val.trim() !== '') {
                            return val.trim();
                          } else if (typeof val !== 'string') {
                            return val;
                          }
                        }
                      }
                      return null;
                    };
                    
                    // Mapeia os campos do pet da API para o formato esperado
                    // O backend pode retornar com nomes em PascalCase (NPet) ou camelCase (nPet)
                    // Verificar TODAS as variações possíveis
                    const petNome = getPetValue(pet.NPet, pet.nPet, pet.nomePet, pet.nome) || 'Sem nome';
                    const petEspecie = getPetValue(pet.EspPet, pet.espPet, pet.especiePet, pet.especie) || 'Não informado';
                    const petRaca = getPetValue(pet.RacaPet, pet.racaPet, pet.raca) || 'Não informado';
                    const petDataNasc = getPetValue(pet.DnPet, pet.dnPet, pet.dataNascimento) || '';
                    const petMicrochip = getPetValue(pet.CmPet, pet.cmPet, pet.cmpet, pet.microchipPet, pet.microchip) || 'Não informado';
                    const petSexo = getPetValue(pet.SexoPet, pet.sexoPet, pet.sexo) || 'Não informado';
                    const petPorte = getPetValue(pet.PortePet, pet.portePet, pet.porte) || 'Não informado';
                    const petPeso = getPetValue(pet.PeqPet, pet.peqPet, pet.pesoPet, pet.peso);
                    const petPesoDisplay = petPeso !== null && petPeso !== undefined ? `${petPeso}${typeof petPeso === 'number' ? ' Kg' : ''}` : 'Não informado';
                    const petCor = getPetValue(pet.CorPet, pet.corPet, pet.cor) || 'Não informado';
                    
                    console.log('Valores mapeados:');
                    console.log('  Nome:', petNome);
                    console.log('  Espécie:', petEspecie);
                    console.log('  Raça:', petRaca);
                    console.log('  Data:', petDataNasc);
                    console.log('  Microchip:', petMicrochip);
                    console.log('  Sexo:', petSexo);
                    console.log('  Porte:', petPorte);
                    console.log('  Peso:', petPesoDisplay);
                    console.log('  Cor:', petCor);
                    
                    // Processar foto do pet
                    let petFoto = perfilLogado;
                    const fotoPet = pet.FotoPet || pet.fotoPet || pet.foto;
                    console.log('Foto do pet recebida:', fotoPet ? (fotoPet.length > 50 ? `${fotoPet.substring(0, 50)}...` : fotoPet) : 'null/undefined');
                    
                    if (fotoPet && fotoPet !== perfilLogado && fotoPet !== '[Base64]' && fotoPet.trim() !== '') {
                      if (fotoPet.startsWith('data:')) {
                        petFoto = fotoPet;
                      } else if (fotoPet.startsWith('http')) {
                        petFoto = fotoPet;
                      } else if (fotoPet.length > 100) {
                        // Provavelmente é base64 puro - adicionar prefixo
                        petFoto = `data:image/jpeg;base64,${fotoPet}`;
                      } else {
                        petFoto = fotoPet;
                      }
                    }
                    
                    console.log('Foto final processada:', petFoto !== perfilLogado ? 'Foto do pet' : 'Foto padrão');
                    
                    return (
                      <div key={pet.IdPet || pet.idPet || pet.id} className="pet-card">
                      <div className="pet-card-header">
                        <div className="pet-info">
                            <img src={petFoto} alt={petNome} className="pet-foto" />
                          <div>
                              <h3 className="pet-nome">{petNome}</h3>
                              <p className="pet-tipo">{petEspecie} - {petRaca}</p>
                          </div>
                        </div>
                          <button className="btn-editar-pet" onClick={() => handleAbrirModalPet(pet)}>
                          <img src={iconeConfirmar} alt="Editar" />
                        </button>
                      </div>
                      <div className="pet-card-body">
                        <div className="pet-detalhes">
                          <div className="pet-detalhe-item">
                              <strong>Data de Nascimento:</strong> {formatarData(petDataNasc)}
                          </div>
                          <div className="pet-detalhe-item">
                              <strong>Microchip:</strong> {petMicrochip}
                          </div>
                          <div className="pet-detalhe-item">
                              <strong>Raça:</strong> {petRaca}
                          </div>
                          <div className="pet-detalhe-item">
                              <strong>Sexo:</strong> {petSexo}
                          </div>
                          <div className="pet-detalhe-item">
                              <strong>Porte:</strong> {petPorte}
                          </div>
                          <div className="pet-detalhe-item">
                              <strong>Peso:</strong> {petPesoDisplay}
                          </div>
                          <div className="pet-detalhe-item">
                              <strong>Cor:</strong> {petCor}
                          </div>
                        </div>
                          <button className="btn-mais-detalhes" onClick={() => handleAbrirModalPet(pet)}>Mais Detalhes &gt;</button>
                      </div>
                    </div>
                    );
                  })
                ) : (
                  <div className="no-pets">
                    <p>Nenhum pet cadastrado</p>
                    <Link to="/cadastro-pet" className="btn-cadastrar-pet" style={{textDecoration: 'none', display: 'inline-flex'}}>
                      <span>+</span>
                      <span>Cadastrar Primeiro Pet</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo Histórico */}
        {activeTab === 'historico' && (
          <div id="historico-content" className="config-content active">
            <div className="historico-card">
              <h2 className="historico-titulo">HISTÓRICO DE SERVIÇOS</h2>
              
              {historico.map(item => (
                <div key={item.id} className="historico-item">
                  <div className="historico-info">
                    <div className="historico-servico">{item.servico}</div>
                    <div className="historico-detalhes">{item.detalhes}</div>
                    <div className="historico-veterinario">{item.veterinario}</div>
                  </div>
                  <div className="historico-status">
                    <span className={`status-badge status-${item.status}`}>
                      {item.status === 'concluido' ? 'CONCLUÍDO' : 'AGENDADO'}
                    </span>
                    <span className="historico-preco">{item.preco}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conteúdo Pagamento */}
        {activeTab === 'pagamento' && (
          <div id="pagamento-content" className="config-content active">
            <h2 className="pagamento-titulo">MÉTODOS DE PAGAMENTO</h2>
            
            <div className="pagamento-layout">
              <div className="pagamento-principal-card">
                <div className="cartao-principal-header">
                  <span className="cartao-principal-label">CARTÃO PRINCIPAL</span>
                </div>
                <div className="cartao-principal-numero">**** **** **** 4532</div>
                <div className="cartao-principal-info">
                  <div className="cartao-info-item">
                    <span className="cartao-info-label">TITULAR</span>
                    <span className="cartao-info-value">MARIA SILVA</span>
                  </div>
                  <div className="cartao-info-item">
                    <span className="cartao-info-label">VALIDADE</span>
                    <span className="cartao-info-value">12/26</span>
                  </div>
                </div>
                <div className="cartao-principal-actions">
                  <button className="btn-padrao">
                    Padrão
                  </button>
                  <button className="btn-deletar-cartao">
                    <i className="bi bi-trash-fill"></i>
                  </button>
                </div>
              </div>

              <div className="pagamento-sidebar">
                <div className="formas-pagamento-section">
                  <h3 className="formas-pagamento-titulo">FORMAS DE PAGAMENTO</h3>
                  <div className="forma-pagamento-item">
                    <i className="bi bi-credit-card-2-front-fill"></i>
                    <span>CARTÃO CRÉDITO/DÉBITO</span>
                  </div>
                  <div className="forma-pagamento-item">
                    <i className="bi bi-qr-code"></i>
                    <span>PIX</span>
                  </div>
                </div>
              </div>
            </div>

            <Link to="/metodo-pagamento" className="btn-adicionar-pagamento">
              <i className="bi bi-plus-circle-fill"></i>
              <span>ADICIONAR MÉTODO DE PAGAMENTO</span>
            </Link>
          </div>
        )}

        {/* Conteúdo Notificações */}
        {activeTab === 'notificacoes' && (
          <div id="notificacoes-content" className="config-content active">
            <div className="notificacoes-card">
              <h2 className="notificacoes-titulo">PREFERÊNCIAS DE NOTIFICAÇÃO</h2>
              
              <div className="notificacao-item">
                <div className="notificacao-info">
                  <div className="notificacao-titulo">E-MAIL DE AGENDAMENTO</div>
                  <div className="notificacao-descricao">RECEBA CONFIRMAÇÕES DE CONSULTAS POR E-MAIL</div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notificacoes.emailAgendamento}
                    onChange={() => handleToggleNotificacao('emailAgendamento')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="notificacao-item">
                <div className="notificacao-info">
                  <div className="notificacao-titulo">SMS DE LEMBRETE</div>
                  <div className="notificacao-descricao">LEMBRETES DE CONSULTAS 24H ANTES</div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notificacoes.smsLembrete}
                    onChange={() => handleToggleNotificacao('smsLembrete')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="notificacao-item">
                <div className="notificacao-info">
                  <div className="notificacao-titulo">PUSH DE EMERGÊNCIA</div>
                  <div className="notificacao-descricao">NOTIFICAÇÕES URGENTES SOBRE SEUS PETS</div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notificacoes.pushEmergencia}
                    onChange={() => handleToggleNotificacao('pushEmergencia')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="notificacao-item">
                <div className="notificacao-info">
                  <div className="notificacao-titulo">WHATSAPP CONFIRMAÇÃO</div>
                  <div className="notificacao-descricao">CONFIRMAÇÕES VIA WHATSAPP</div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notificacoes.whatsappConfirmacao}
                    onChange={() => handleToggleNotificacao('whatsappConfirmacao')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="notificacao-item">
                <div className="notificacao-info">
                  <div className="notificacao-titulo">E-MAILS PROMOCIONAIS</div>
                  <div className="notificacao-descricao">OFERTAS E NOVIDADES SOBRE SERVIÇOS</div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notificacoes.emailsPromocionais}
                    onChange={() => handleToggleNotificacao('emailsPromocionais')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Botão de Excluir Conta - Aparece em todas as abas */}
        <div style={{ 
          marginTop: '40px', 
          paddingTop: '40px', 
          borderTop: '2px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <button
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            style={{
              backgroundColor: isDeleting ? '#9CA3AF' : '#DC2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              textTransform: 'uppercase',
              transition: 'background-color 0.3s ease',
              fontFamily: "'Ysabeau SC', sans-serif",
              opacity: isDeleting ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) {
                e.target.style.backgroundColor = '#B91C1C';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDeleting) {
                e.target.style.backgroundColor = '#DC2626';
              }
            }}
          >
            <i className="bi bi-trash-fill" style={{ marginRight: '8px' }}></i>
            {isDeleting ? 'Excluindo...' : 'Excluir Conta'}
          </button>
      </div>
      </div>

      {/* Modal de Detalhes do Pet */}
      {modalPet && (
        <div className="modal-overlay" onClick={handleFecharModalPet} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <button 
              onClick={handleFecharModalPet}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>

            {!isEditingPet ? (
              <>
                <h2 style={{ marginBottom: '20px', color: '#6B46C1' }}>
                  {modalPet.NPet || modalPet.nomePet || modalPet.nome || 'Detalhes do Pet'}
                </h2>
                
                <div style={{ marginBottom: '20px' }}>
                  {(() => {
                    const fotoPet = modalPet.FotoPet || modalPet.fotoPet || modalPet.foto;
                    let fotoUrl = perfilLogado;
                    if (fotoPet && fotoPet !== perfilLogado && fotoPet !== '[Base64]' && fotoPet.trim() !== '') {
                      if (fotoPet.startsWith('data:')) {
                        fotoUrl = fotoPet;
                      } else if (fotoPet.startsWith('http')) {
                        fotoUrl = fotoPet;
                      } else if (fotoPet.length > 100) {
                        fotoUrl = `data:image/jpeg;base64,${fotoPet}`;
                      } else {
                        fotoUrl = fotoPet;
                      }
                    }
                    return (
                      <img 
                        src={fotoUrl} 
                        alt={modalPet.NPet || modalPet.nomePet || 'Pet'} 
                        style={{
                          width: '150px',
                          height: '150px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          marginBottom: '15px'
                        }}
                      />
                    );
                  })()}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  {(() => {
                    // Função auxiliar para obter valor do campo, tratando strings vazias
                    const getValue = (value) => {
                      if (value === null || value === undefined) return 'Não informado';
                      if (typeof value === 'string' && value.trim() === '') return 'Não informado';
                      return value;
                    };
                    
                    // Função auxiliar para obter valor considerando todas as variações de nome
                    const getModalValue = (...values) => {
                      for (const val of values) {
                        if (val !== null && val !== undefined && val !== '') {
                          if (typeof val === 'string' && val.trim() !== '') {
                            return val.trim();
                          } else if (typeof val !== 'string') {
                            return val;
                          }
                        }
                      }
                      return null;
                    };
                    
                    const nome = getValue(getModalValue(modalPet.NPet, modalPet.nPet, modalPet.nomePet, modalPet.nome));
                    const especie = getValue(getModalValue(modalPet.EspPet, modalPet.espPet, modalPet.especiePet, modalPet.especie));
                    const raca = getValue(getModalValue(modalPet.RacaPet, modalPet.racaPet, modalPet.raca));
                    const dataNasc = formatarData(getModalValue(modalPet.DnPet, modalPet.dnPet, modalPet.dataNascimento) || '');
                    const microchip = getValue(getModalValue(modalPet.CmPet, modalPet.cmPet, modalPet.cmpet, modalPet.microchipPet, modalPet.microchip));
                    const sexo = getValue(getModalValue(modalPet.SexoPet, modalPet.sexoPet, modalPet.sexo));
                    const castrado = (modalPet.CasPet === true || modalPet.casPet === true) ? 'Sim' : (modalPet.CasPet === false || modalPet.casPet === false) ? 'Não' : 'Não informado';
                    const porte = getValue(getModalValue(modalPet.PortePet, modalPet.portePet, modalPet.porte));
                    const pesoValue = getModalValue(modalPet.PeqPet, modalPet.peqPet, modalPet.pesoPet, modalPet.peso);
                    const peso = pesoValue !== null && pesoValue !== undefined && pesoValue !== '' ? `${pesoValue} Kg` : 'Não informado';
                    const cor = getValue(getModalValue(modalPet.CorPet, modalPet.corPet, modalPet.cor));
                    const condicoes = getValue(getModalValue(modalPet.CpePet, modalPet.cpePet, modalPet.condicoesPreexistentes));
                    const medicacoes = getValue(getModalValue(modalPet.MaPet, modalPet.maPet, modalPet.medicacoesAtuais));
                    
                    console.log('=== DADOS DO PET NO MODAL ===');
                    console.log('modalPet completo:', modalPet);
                    console.log('Nome:', nome, '(NPet:', modalPet.NPet, ', nPet:', modalPet.nPet, ', nomePet:', modalPet.nomePet, ', nome:', modalPet.nome, ')');
                    console.log('Espécie:', especie, '(EspPet:', modalPet.EspPet, ', espPet:', modalPet.espPet, ', especiePet:', modalPet.especiePet, ', especie:', modalPet.especie, ')');
                    console.log('Raça:', raca, '(RacaPet:', modalPet.RacaPet, ', racaPet:', modalPet.racaPet, ', raca:', modalPet.raca, ')');
                    console.log('Data:', dataNasc, '(DnPet:', modalPet.DnPet, ', dnPet:', modalPet.dnPet, ')');
                    console.log('Microchip:', microchip, '(CmPet:', modalPet.CmPet, ', cmPet:', modalPet.cmPet, ', cmpet:', modalPet.cmpet, ')');
                    console.log('Sexo:', sexo, '(SexoPet:', modalPet.SexoPet, ', sexoPet:', modalPet.sexoPet, ')');
                    console.log('Porte:', porte, '(PortePet:', modalPet.PortePet, ', portePet:', modalPet.portePet, ')');
                    console.log('Peso:', peso, '(PeqPet:', modalPet.PeqPet, ', peqPet:', modalPet.peqPet, ')');
                    console.log('Cor:', cor, '(CorPet:', modalPet.CorPet, ', corPet:', modalPet.corPet, ')');
                    console.log('Castrado:', castrado, '(CasPet:', modalPet.CasPet, ', casPet:', modalPet.casPet, ')');
                    console.log('Condições:', condicoes, '(CpePet:', modalPet.CpePet, ', cpePet:', modalPet.cpePet, ')');
                    console.log('Medicações:', medicacoes, '(MaPet:', modalPet.MaPet, ', maPet:', modalPet.maPet, ')');
                    
                    return (
                      <>
                        <div><strong>Nome:</strong> {nome}</div>
                        <div><strong>Espécie:</strong> {especie}</div>
                        <div><strong>Raça:</strong> {raca}</div>
                        <div><strong>Data de Nascimento:</strong> {dataNasc}</div>
                        <div><strong>Microchip:</strong> {microchip}</div>
                        <div><strong>Sexo:</strong> {sexo}</div>
                        <div><strong>Castrado:</strong> {castrado}</div>
                        <div><strong>Porte:</strong> {porte}</div>
                        <div><strong>Peso:</strong> {peso}</div>
                        <div><strong>Cor:</strong> {cor}</div>
                        <div><strong>Condições Preexistentes:</strong> {condicoes}</div>
                        <div><strong>Medicações Atuais:</strong> {medicacoes}</div>
                      </>
                    );
                  })()}
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button
                    onClick={handleIniciarEdicaoPet}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#6B46C1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={handleExcluirPet}
                    disabled={isDeletingPet}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#DC2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isDeletingPet ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      opacity: isDeletingPet ? 0.6 : 1
                    }}
                  >
                    {isDeletingPet ? 'Excluindo...' : 'Excluir'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ marginBottom: '20px', color: '#6B46C1' }}>Editar Pet</h2>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Foto do Pet</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePetFotoChange}
                    style={{ marginBottom: '10px' }}
                  />
                  {petFotoPreview && (
                    <img 
                      src={petFotoPreview} 
                      alt="Preview" 
                      style={{
                        width: '150px',
                        height: '150px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        marginTop: '10px'
                      }}
                    />
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Nome *</label>
                    <input
                      type="text"
                      value={petEditData?.NPet || ''}
                      onChange={(e) => setPetEditData({...petEditData, NPet: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Espécie</label>
                    <input
                      type="text"
                      value={petEditData?.EspPet || ''}
                      onChange={(e) => setPetEditData({...petEditData, EspPet: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Raça</label>
                    <input
                      type="text"
                      value={petEditData?.RacaPet || ''}
                      onChange={(e) => setPetEditData({...petEditData, RacaPet: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Data de Nascimento</label>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <input
                        type="number"
                        placeholder="Dia"
                        min="1"
                        max="31"
                        value={petEditData?.diaNascimento || ''}
                        onChange={(e) => setPetEditData({...petEditData, diaNascimento: e.target.value})}
                        style={{ width: '60px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                      <input
                        type="number"
                        placeholder="Mês"
                        min="1"
                        max="12"
                        value={petEditData?.mesNascimento || ''}
                        onChange={(e) => setPetEditData({...petEditData, mesNascimento: e.target.value})}
                        style={{ width: '60px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                      <input
                        type="number"
                        placeholder="Ano"
                        min="1900"
                        max={new Date().getFullYear()}
                        value={petEditData?.anoNascimento || ''}
                        onChange={(e) => setPetEditData({...petEditData, anoNascimento: e.target.value})}
                        style={{ width: '80px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Microchip</label>
                    <input
                      type="text"
                      value={petEditData?.CmPet || ''}
                      onChange={(e) => setPetEditData({...petEditData, CmPet: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Sexo</label>
                    <select
                      value={petEditData?.SexoPet || 'Macho'}
                      onChange={(e) => setPetEditData({...petEditData, SexoPet: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                      <option value="Macho">Macho</option>
                      <option value="Fêmea">Fêmea</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Castrado</label>
                    <select
                      value={petEditData?.CasPet === true ? 'sim' : petEditData?.CasPet === false ? 'não' : ''}
                      onChange={(e) => setPetEditData({...petEditData, CasPet: e.target.value === 'sim' ? true : e.target.value === 'não' ? false : null})}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                      <option value="">Não informado</option>
                      <option value="sim">Sim</option>
                      <option value="não">Não</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Porte</label>
                    <select
                      value={petEditData?.PortePet || 'Pequeno'}
                      onChange={(e) => setPetEditData({...petEditData, PortePet: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                      <option value="Pequeno">Pequeno</option>
                      <option value="Médio">Médio</option>
                      <option value="Grande">Grande</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Peso (Kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={petEditData?.PeqPet || ''}
                      onChange={(e) => setPetEditData({...petEditData, PeqPet: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Cor</label>
                    <input
                      type="text"
                      value={petEditData?.CorPet || ''}
                      onChange={(e) => setPetEditData({...petEditData, CorPet: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Condições Preexistentes</label>
                    <input
                      type="text"
                      value={petEditData?.CpePet || ''}
                      onChange={(e) => setPetEditData({...petEditData, CpePet: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Medicações Atuais</label>
                    <input
                      type="text"
                      value={petEditData?.MaPet || ''}
                      onChange={(e) => setPetEditData({...petEditData, MaPet: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button
                    onClick={() => {
                      setIsEditingPet(false);
                      setPetEditData(null);
                      setPetFotoPreview(null);
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#6B7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSalvarPet}
                    disabled={isSavingPet}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#6B46C1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isSavingPet ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      opacity: isSavingPet ? 0.6 : 1
                    }}
                  >
                    {isSavingPet ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default Perfil;