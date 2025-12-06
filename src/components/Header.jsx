import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';
import Vetorizado from '../assets/Vetorizado.svg';
import iconeNotificacao from '../assets/iconeNotificacao.png';
import perfilLogado from '../assets/perfilLogado.png';

const Header = ({ isLoggedIn: propIsLoggedIn }) => {
  let contextIsLoggedIn = false;
  let logout = () => {};
  let user = null;
  
  try {
    const auth = useAuth();
    contextIsLoggedIn = auth.isLoggedIn;
    logout = auth.logout;
    user = auth.user;
  } catch (e) {
    // Contexto não disponível, usar prop
  }
  
  const isLoggedIn = propIsLoggedIn !== undefined ? propIsLoggedIn : contextIsLoggedIn;
  
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [profilePic, setProfilePic] = useState(perfilLogado);
  const dropdownRef = useRef(null);
  const profilePicRef = useRef(null);
  
  // Verificação simples de tipo de usuário
  const isTutor = user?.accountType === 'tutor' || user?.tipo === 'Tutor';
  // Verificar se é clínica pelo usuário ou pela rota
  const rotasClinica = ['/painel-clinica', '/agendamentos', '/relatorios', '/profissionais-clinica'];
  const isClinica = (user?.accountType === 'clinica' || user?.tipo === 'Clínica') ||
                    rotasClinica.includes(location.pathname) ||
                    location.pathname.startsWith('/perfil-profissional');
  
  // Rotas que requerem header logado
  const rotasLogadas = ['/home-logado', '/painel-clinica', '/agendamentos', '/relatorios', '/profissionais-clinica', '/perfil', '/servicos-plus'];
  // Se estiver logado ou em uma rota que requer login, mostrar header logado
  const shouldShowLoggedInHeader = isLoggedIn || rotasLogadas.includes(location.pathname);
  
  // Se estiver em /home-logado e não for clínica, tratar como tutor
  const effectiveIsTutor = isTutor || (location.pathname === '/home-logado' && !isClinica);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Buscar foto do perfil do usuário logado
  useEffect(() => {
    const loadUserPhoto = async () => {
      // Verificar se há token e userId no localStorage (mesmo que o contexto ainda não tenha carregado)
      const token = localStorage.getItem('token');
      const userIdFromStorage = localStorage.getItem('userId');
      const userFromStorage = localStorage.getItem('user');
      
      // Se não tem token, não está logado
      if (!token) {
        setProfilePic(perfilLogado);
        localStorage.removeItem('userFoto');
        return;
      }

      // Tentar obter userId do contexto ou do localStorage
      let userId = null;
      if (user) {
        userId = user.idTutor || user.id;
      }
      if (!userId && userFromStorage) {
        try {
          const parsedUser = JSON.parse(userFromStorage);
          userId = parsedUser.idTutor || parsedUser.id;
        } catch (e) {
          console.error('Erro ao parsear user do localStorage:', e);
        }
      }
      if (!userId) {
        userId = userIdFromStorage;
      }
      
      if (!userId) {
        // Se não tem userId mas tem token, tentar usar foto salva temporariamente
        const savedFoto = localStorage.getItem('userFoto');
        if (savedFoto && savedFoto !== 'null' && savedFoto !== 'undefined') {
          setProfilePic(savedFoto);
        } else {
          setProfilePic(perfilLogado);
        }
        return;
      }

      // Verificar se a foto salva no localStorage pertence ao usuário atual
      const savedFoto = localStorage.getItem('userFoto');
      const savedUserId = localStorage.getItem('userId');
      
      // Se a foto salva pertence ao usuário atual, usar ela temporariamente enquanto busca do backend
      if (savedFoto && savedFoto !== 'null' && savedFoto !== 'undefined' && 
          savedUserId && savedUserId === userId.toString()) {
        setProfilePic(savedFoto);
        // Continuar para buscar do backend e atualizar se necessário
      } else {
        // Se a foto não pertence ao usuário atual, limpar
        localStorage.removeItem('userFoto');
      }

      // Sempre buscar do backend para garantir foto atualizada
      try {
        if (token && userId) {
          const response = await fetch(`/api/Tutors/id/${userId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const tutorData = await response.json();
            let fotoProcessada = null;
            
            if (tutorData.fotoTutor) {
              const fotoOriginal = tutorData.fotoTutor.trim();
              
              // Processar foto base64 do banco
              // Se a foto é uma data URL (base64 com prefixo), usar diretamente
              if (fotoOriginal.startsWith('data:')) {
                fotoProcessada = fotoOriginal;
              } 
              // Se é uma URL completa (http), usar diretamente
              else if (fotoOriginal.startsWith('http')) {
                fotoProcessada = fotoOriginal;
              }
              // Se é um caminho relativo da API, tentar construir URL
              else if (fotoOriginal.startsWith('/api/')) {
                fotoProcessada = `${fotoOriginal}`;
              }
              // Verificar se é base64 puro (mesmo que comece com /)
              // Base64 de imagem JPEG começa com /9j/, PNG com iVBORw0KGgo, GIF com R0lGODlh
              else {
                // Remove espaços e quebras de linha
                const base64String = fotoOriginal.replace(/\s/g, '');
                
                // Verificar se é base64 válido (caracteres permitidos: A-Z, a-z, 0-9, +, /, =)
                const base64Regex = /^[A-Za-z0-9+/=]+$/;
                
                // Se tem mais de 500 caracteres e parece base64, é provavelmente uma imagem base64
                if (base64String.length > 500 && base64Regex.test(base64String)) {
                  // É base64 puro - adicionar prefixo
                  fotoProcessada = `data:image/jpeg;base64,${base64String}`;
                }
                // Se começa com / mas tem menos de 100 caracteres, pode ser nome de arquivo
                else if (fotoOriginal.startsWith('/') && base64String.length < 100) {
                  fotoProcessada = `/api/Tutors/fotos${fotoOriginal}`;
                }
                // Se não começa com / e tem menos de 100 caracteres, é nome de arquivo
                else if (!fotoOriginal.startsWith('/') && base64String.length < 100) {
                  fotoProcessada = `/api/Tutors/fotos/${fotoOriginal}`;
                }
                // Caso padrão: tentar como base64 se passar na validação
                else if (base64Regex.test(base64String) && base64String.length > 100) {
                  fotoProcessada = `data:image/jpeg;base64,${base64String}`;
                }
                else {
                  fotoProcessada = fotoOriginal;
                }
              }
              
              if (fotoProcessada) {
                setProfilePic(fotoProcessada);
                // Salvar foto com o userId para verificar depois
                localStorage.setItem('userFoto', fotoProcessada);
                localStorage.setItem('userId', userId.toString());
              } else {
                // Se não tem foto, limpar do localStorage
                localStorage.removeItem('userFoto');
                setProfilePic(perfilLogado);
              }
            } else {
              // Se não tem foto no backend, limpar do localStorage
              localStorage.removeItem('userFoto');
              setProfilePic(perfilLogado);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar foto do perfil:', error);
        // Se der erro, limpar foto antiga e usar padrão
        localStorage.removeItem('userFoto');
        if (user?.foto) {
          setProfilePic(user.foto);
        } else {
          setProfilePic(perfilLogado);
        }
      }
    };

    loadUserPhoto();
  }, [isLoggedIn, user, location.pathname]); // Adicionar location.pathname para recarregar quando mudar de página

  // Atualizar foto do perfil quando o usuário for atualizado via evento
  useEffect(() => {
    const handleUserUpdate = (event) => {
      if (event.detail && event.detail.foto) {
        setProfilePic(event.detail.foto);
        localStorage.setItem('userFoto', event.detail.foto);
      }
    };

    // Atualizar foto quando usuário faz login
    const handleUserLogin = (event) => {
      // Forçar recarregar a foto do backend quando faz login
      if (isLoggedIn && user) {
        const loadPhoto = async () => {
          try {
            const token = localStorage.getItem('token');
            const userId = user.idTutor || user.id || localStorage.getItem('userId');
            
            if (token && userId) {
              const response = await fetch(`/api/Tutors/id/${userId}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              if (response.ok) {
                const tutorData = await response.json();
                if (tutorData.fotoTutor) {
                  const fotoOriginal = tutorData.fotoTutor.trim();
                  const base64String = fotoOriginal.replace(/\s/g, '');
                  const base64Regex = /^[A-Za-z0-9+/=]+$/;
                  
                  let fotoProcessada = null;
                  if (fotoOriginal.startsWith('data:')) {
                    fotoProcessada = fotoOriginal;
                  } else if (fotoOriginal.startsWith('http')) {
                    fotoProcessada = fotoOriginal;
                  } else if (fotoOriginal.startsWith('/api/')) {
                    fotoProcessada = `${fotoOriginal}`;
                  } else if (base64String.length > 500 && base64Regex.test(base64String)) {
                    fotoProcessada = `data:image/jpeg;base64,${base64String}`;
                  }
                  
                  if (fotoProcessada) {
                    setProfilePic(fotoProcessada);
                    localStorage.setItem('userFoto', fotoProcessada);
                    localStorage.setItem('userId', userId.toString());
                  }
                }
              }
            }
          } catch (error) {
            console.error('Erro ao carregar foto após login:', error);
          }
        };
        loadPhoto();
      }
    };

    window.addEventListener('userUpdated', handleUserUpdate);
    window.addEventListener('userLogin', handleUserLogin);
    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate);
      window.removeEventListener('userLogin', handleUserLogin);
    };
  }, [isLoggedIn, user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isDropdownOpen &&
        dropdownRef.current &&
        profilePicRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !profilePicRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <header className={`main-header ${isClinica ? 'header-clinica' : ''}`}>
      <nav className="navbar">
        <div className="nav-logo">
          <Link to={shouldShowLoggedInHeader && isClinica ? '/painel-clinica' : shouldShowLoggedInHeader ? '/home-logado' : '/'}>
            <img src={Vetorizado} alt="Logo Artemys" />
          </Link>
          <div className="nav-logo-text">
            <span className="brand-name">ARTEMYS</span>
            <span className="brand-slogan">CONECTANDO QUEM AMA A QUEM CUIDA</span>
          </div>
        </div>

        <button 
          className={`menu-toggle mobile-only ${isMenuOpen ? 'active' : ''}`}
          id="menu-toggle"
          onClick={toggleMenu}
          aria-label="Menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`} id="nav-links">
          {shouldShowLoggedInHeader && isClinica ? (
            <>
              <li>
                <Link to="/painel-clinica" className={isActive('/painel-clinica')} onClick={closeMenu}>
                  PAINEL
                </Link>
              </li>
              <li>
                <Link to="/profissionais-clinica" className={isActive('/profissionais-clinica')} onClick={closeMenu}>
                  PROFISSIONAIS
                </Link>
              </li>
              <li>
                <Link to="/agendamentos" className={isActive('/agendamentos')} onClick={closeMenu}>
                  AGENDAMENTOS
                </Link>
              </li>
            </>
          ) : shouldShowLoggedInHeader ? (
            <>
              <li>
                <Link to="/home-logado" className={isActive('/home-logado')} onClick={closeMenu}>
                  Início
                </Link>
              </li>
              <li>
                <Link to="/artigos" className={isActive('/artigos')} onClick={closeMenu}>
                  Artigos
                </Link>
              </li>
              <li>
                <Link to="/planos" className={isActive('/planos')} onClick={closeMenu}>
                  Planos de Assinatura
                </Link>
              </li>
              <li>
                <Link to="/agendamentos" className={isActive('/agendamentos')} onClick={closeMenu}>
                  Agendamentos
                </Link>
              </li>
              <li>
                <Link to="/servicos" className={isActive('/servicos')} onClick={closeMenu}>
                  Serviços
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/" className={isActive('/')} onClick={closeMenu}>
                  Início
                </Link>
              </li>
              <li>
                <Link to="/artigos" className={isActive('/artigos')} onClick={closeMenu}>
                  Artigos
                </Link>
              </li>
              <li>
                <Link to="/planos" className={isActive('/planos')} onClick={closeMenu}>
                  Planos de Assinatura
                </Link>
              </li>
              <li>
                <Link to="/sobre" className={isActive('/sobre')} onClick={closeMenu}>
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link to="/servicos" className={isActive('/servicos')} onClick={closeMenu}>
                  Serviços
                </Link>
              </li>
            </>
          )}
        </ul>

        {!shouldShowLoggedInHeader ? (
          <div className="nav-buttons">
            <Link to="/login" className="btn-login">Entrar</Link>
            <Link to="/cadastro" className="btn-signup">Cadastrar</Link>
          </div>
        ) : (
          <div className="nav-user-actions">
            <div className="action-icon">
              <img src={iconeNotificacao} alt="Notificações" />
            </div>
            <div className="profile-container">
              <img
                ref={profilePicRef}
                src={profilePic}
                alt="Perfil"
                className="profile-pic"
                id="profile-pic-btn"
                onClick={toggleDropdown}
              />
              <div 
                ref={dropdownRef}
                className={`profile-dropdown ${isDropdownOpen ? 'show' : ''}`}
                id="profile-dropdown"
              >
                {effectiveIsTutor ? (
                  <>
                    <Link to="/perfil" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                      <i className="bi bi-person"></i>
                      Meu Perfil
                    </Link>
                    <Link to="/agendamentos" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                      <i className="bi bi-calendar-check"></i>
                      Agendamentos
                    </Link>
                    <Link to="/perfil#pagamento" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                      <i className="bi bi-credit-card"></i>
                      Pagamento
                    </Link>
                    <div className="dropdown-divider"></div>
                    <Link 
                      to="/" 
                      className="dropdown-item" 
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDropdownOpen(false);
                        logout();
                        navigate('/');
                      }}
                    >
                      Sair
                    </Link>
                  </>
                ) : isClinica ? (
                  <>
                    <Link to="/painel-clinica" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                      <i className="bi bi-speedometer2"></i>
                      Painel
                    </Link>
                    <Link to="/agendamentos" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                      <i className="bi bi-calendar-check"></i>
                      Agendamentos
                    </Link>
                    <Link to="/relatorios" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                      <i className="bi bi-file-earmark-text"></i>
                      Relatórios
                    </Link>
                    <div className="dropdown-divider"></div>
                    <Link 
                      to="/" 
                      className="dropdown-item" 
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDropdownOpen(false);
                        logout();
                        navigate('/');
                      }}
                    >
                      Sair
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/perfil" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>Meu Perfil</Link>
                    <Link to="/agendamentos" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>Agendamentos</Link>
                    <Link to="/perfil#pagamento" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>Pagamento</Link>
                    <Link 
                      to="/" 
                      className="dropdown-item" 
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDropdownOpen(false);
                        logout();
                        navigate('/');
                      }}
                    >
                      Sair
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;

