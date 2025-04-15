import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Trophy, LogIn, UserPlus, Github, Menu, X } from 'lucide-react';

export function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0f1117] relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIiBmaWxsPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIi8+PC9zdmc+')] opacity-50"></div>

      {/* Header */}
      <header className="relative bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2 group">
                <Trophy className="h-8 w-8 text-green-500 transition-transform group-hover:scale-110" />
                <span className="text-xl font-bold text-white">Dribbla</span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Cadastrar</span>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2 border-t border-gray-700/50 animate-fade-in">
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-3 text-gray-300 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-2 px-4 py-3 text-gray-300 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <UserPlus className="w-4 h-4" />
                <span>Cadastrar</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative bg-gray-800/50 backdrop-blur-sm border-t border-gray-700/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-6 w-6 text-green-500" />
                <span className="text-lg font-bold text-white">Dribbla</span>
              </div>
              <p className="text-gray-400">
                A plataforma completa para organização de campeonatos de futebol.
              </p>
              <div className="mt-4 text-sm text-gray-400">
                Desenvolvido por{' '}
                <a
                  href="https://labora-tech.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-500 hover:text-green-400 transition-colors"
                >
                  Labora Tech
                </a>
                <br />
                Transformando ideias em soluções digitais.
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Links Úteis</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                    Campeonatos
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-gray-400 hover:text-white transition-colors">
                    Criar Conta
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-gray-400 hover:text-white transition-colors">
                    Área do Organizador
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/labora-tech"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Contato</h3>
              <p className="text-gray-400 mb-4">
                Entre em contato conosco para mais informações sobre como organizar seu campeonato.
              </p>
              <a
                href="mailto:contato@dribbla.com"
                className="text-green-500 hover:text-green-400 transition-colors inline-block"
              >
                contato@dribbla.com
              </a>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} Dribbla. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}