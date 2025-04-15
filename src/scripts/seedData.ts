import { supabase } from '../lib/supabase';

const CHAMPIONSHIP = {
  name: 'Copa Paulista 2025',
  category: 'Profissional',
  start_date: '2025-03-01',
  end_date: '2025-11-30',
  rules: `REGULAMENTO COPA PAULISTA 2025

1. FORMATO DA COMPETIÇÃO
   - 10 equipes participantes
   - Turno e returno (pontos corridos)
   - Todos contra todos
   - 3 pontos por vitória, 1 ponto por empate

2. CRITÉRIOS DE DESEMPATE
   - Maior número de vitórias
   - Melhor saldo de gols
   - Maior número de gols marcados
   - Confronto direto
   - Menor número de cartões vermelhos
   - Menor número de cartões amarelos
   - Sorteio

3. PREMIAÇÃO
   - Campeão: Troféu + R$ 500.000,00
   - Vice-campeão: R$ 250.000,00
   - Artilheiro: Troféu + R$ 50.000,00

4. REGULAMENTO DISCIPLINAR
   - 3 cartões amarelos: suspensão por 1 jogo
   - Cartão vermelho: suspensão mínima de 1 jogo
   - Agressão física: eliminação do campeonato

5. REGRAS ESPECÍFICAS
   - 5 substituições permitidas por jogo
   - Mínimo de 7 jogadores para início da partida
   - Tolerância de 30 minutos de atraso
   - VAR em todas as partidas

6. INSCRIÇÕES
   - Máximo de 25 jogadores por equipe
   - Idade mínima: 16 anos
   - Janela de transferências: até a 10ª rodada`,
  logo_url: 'https://colunadofla.com/wp-content/uploads/2016/01/4ZZPBmY1.jpg',
  is_active: true
};

const TEAMS = [
  {
    name: 'Santos FC',
    coach_name: 'Fábio Carille',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Santos_Logo.png/1024px-Santos_Logo.png',
    primary_color: '#FFFFFF',
    secondary_color: '#000000',
    players: [
      { name: 'João Paulo', position: 'Goleiro', jersey_number: 1 },
      { name: 'Vladimir', position: 'Goleiro', jersey_number: 12 },
      { name: 'Messias', position: 'Zagueiro', jersey_number: 3 },
      { name: 'Joaquim', position: 'Zagueiro', jersey_number: 4 },
      { name: 'Gil', position: 'Zagueiro', jersey_number: 13 },
      { name: 'Felipe Jonatan', position: 'Lateral Esquerdo', jersey_number: 6 },
      { name: 'Jorge', position: 'Lateral Esquerdo', jersey_number: 16 },
      { name: 'João Lucas', position: 'Lateral Direito', jersey_number: 2 },
      { name: 'Hayner', position: 'Lateral Direito', jersey_number: 22 },
      { name: 'Diego Pituca', position: 'Volante', jersey_number: 8 },
      { name: 'João Schmidt', position: 'Volante', jersey_number: 5 },
      { name: 'Tomás Rincón', position: 'Volante', jersey_number: 25 },
      { name: 'Nonato', position: 'Meio Campo', jersey_number: 7 },
      { name: 'Giuliano', position: 'Meio Campo', jersey_number: 10 },
      { name: 'Cazares', position: 'Meio Campo', jersey_number: 20 },
      { name: 'Otero', position: 'Meio Campo', jersey_number: 11 },
      { name: 'Marcelinho', position: 'Atacante', jersey_number: 9 },
      { name: 'Furch', position: 'Atacante', jersey_number: 19 },
      { name: 'Willian Bigode', position: 'Atacante', jersey_number: 17 },
      { name: 'Pedrinho', position: 'Atacante', jersey_number: 21 }
    ]
  },
  {
    name: 'SE Palmeiras',
    coach_name: 'Abel Ferreira',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Palmeiras_logo.svg/1024px-Palmeiras_logo.svg.png',
    primary_color: '#006437',
    secondary_color: '#FFFFFF',
    players: [
      { name: 'Weverton', position: 'Goleiro', jersey_number: 1 },
      { name: 'Marcelo Lomba', position: 'Goleiro', jersey_number: 12 },
      { name: 'Gustavo Gómez', position: 'Zagueiro', jersey_number: 3 },
      { name: 'Murilo', position: 'Zagueiro', jersey_number: 4 },
      { name: 'Luan', position: 'Zagueiro', jersey_number: 13 },
      { name: 'Piquerez', position: 'Lateral Esquerdo', jersey_number: 6 },
      { name: 'Vanderlan', position: 'Lateral Esquerdo', jersey_number: 16 },
      { name: 'Mayke', position: 'Lateral Direito', jersey_number: 2 },
      { name: 'Marcos Rocha', position: 'Lateral Direito', jersey_number: 22 },
      { name: 'Zé Rafael', position: 'Volante', jersey_number: 8 },
      { name: 'Richard Ríos', position: 'Volante', jersey_number: 5 },
      { name: 'Aníbal Moreno', position: 'Volante', jersey_number: 25 },
      { name: 'Raphael Veiga', position: 'Meio Campo', jersey_number: 7 },
      { name: 'Jhon Jhon', position: 'Meio Campo', jersey_number: 10 },
      { name: 'Luis Guilherme', position: 'Meio Campo', jersey_number: 20 },
      { name: 'Rony', position: 'Atacante', jersey_number: 11 },
      { name: 'Endrick', position: 'Atacante', jersey_number: 9 },
      { name: 'Flaco López', position: 'Atacante', jersey_number: 19 },
      { name: 'Bruno Rodrigues', position: 'Atacante', jersey_number: 17 },
      { name: 'Estêvão', position: 'Atacante', jersey_number: 21 }
    ]
  },
  {
    name: 'São Paulo FC',
    coach_name: 'Thiago Carpini',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Brasao_do_Sao_Paulo_Futebol_Clube.svg/1024px-Brasao_do_Sao_Paulo_Futebol_Clube.svg.png',
    primary_color: '#FF0000',
    secondary_color: '#FFFFFF',
    players: [
      { name: 'Rafael', position: 'Goleiro', jersey_number: 1 },
      { name: 'Young', position: 'Goleiro', jersey_number: 12 },
      { name: 'Arboleda', position: 'Zagueiro', jersey_number: 3 },
      { name: 'Diego Costa', position: 'Zagueiro', jersey_number: 4 },
      { name: 'Alan Franco', position: 'Zagueiro', jersey_number: 13 },
      { name: 'Welington', position: 'Lateral Esquerdo', jersey_number: 6 },
      { name: 'Patryck', position: 'Lateral Esquerdo', jersey_number: 16 },
      { name: 'Rafinha', position: 'Lateral Direito', jersey_number: 2 },
      { name: 'Igor Vinícius', position: 'Lateral Direito', jersey_number: 22 },
      { name: 'Pablo Maia', position: 'Volante', jersey_number: 8 },
      { name: 'Alisson', position: 'Volante', jersey_number: 5 },
      { name: 'Luiz Gustavo', position: 'Volante', jersey_number: 25 },
      { name: 'Lucas Moura', position: 'Meio Campo', jersey_number: 7 },
      { name: 'James Rodríguez', position: 'Meio Campo', jersey_number: 10 },
      { name: 'Michel Araújo', position: 'Meio Campo', jersey_number: 20 },
      { name: 'Wellington Rato', position: 'Meio Campo', jersey_number: 11 },
      { name: 'Calleri', position: 'Atacante', jersey_number: 9 },
      { name: 'André Silva', position: 'Atacante', jersey_number: 19 },
      { name: 'Luciano', position: 'Atacante', jersey_number: 17 },
      { name: 'Ferreirinha', position: 'Atacante', jersey_number: 21 }
    ]
  },
  {
    name: 'SC Corinthians',
    coach_name: 'António Oliveira',
    logo_url: 'https://upload.wikimedia.org/wikipedia/pt/thumb/b/b4/Corinthians_simbolo.png/1024px-Corinthians_simbolo.png',
    primary_color: '#000000',
    secondary_color: '#FFFFFF',
    players: [
      { name: 'Cássio', position: 'Goleiro', jersey_number: 1 },
      { name: 'Carlos Miguel', position: 'Goleiro', jersey_number: 12 },
      { name: 'Félix Torres', position: 'Zagueiro', jersey_number: 3 },
      { name: 'Gustavo Henrique', position: 'Zagueiro', jersey_number: 4 },
      { name: 'Caetano', position: 'Zagueiro', jersey_number: 13 },
      { name: 'Hugo', position: 'Lateral Esquerdo', jersey_number: 6 },
      { name: 'Diego Palacios', position: 'Lateral Esquerdo', jersey_number: 16 },
      { name: 'Fagner', position: 'Lateral Direito', jersey_number: 2 },
      { name: 'Léo Maná', position: 'Lateral Direito', jersey_number: 22 },
      { name: 'Raniele', position: 'Volante', jersey_number: 8 },
      { name: 'Maycon', position: 'Volante', jersey_number: 5 },
      { name: 'Fausto Vera', position: 'Volante', jersey_number: 25 },
      { name: 'Rodrigo Garro', position: 'Meio Campo', jersey_number: 7 },
      { name: 'Renato Augusto', position: 'Meio Campo', jersey_number: 10 },
      { name: 'Matías Rojas', position: 'Meio Campo', jersey_number: 20 },
      { name: 'Igor Coronado', position: 'Meio Campo', jersey_number: 11 },
      { name: 'Yuri Alberto', position: 'Atacante', jersey_number: 9 },
      { name: 'Pedro Raul', position: 'Atacante', jersey_number: 19 },
      { name: 'Wesley', position: 'Atacante', jersey_number: 17 },
      { name: 'Romero', position: 'Atacante', jersey_number: 21 }
    ]
  },
  {
    name: 'Red Bull Bragantino',
    coach_name: 'Pedro Caixinha',
    logo_url: 'https://upload.wikimedia.org/wikipedia/pt/thumb/0/07/RedBullBragantino.png/1024px-RedBullBragantino.png',
    primary_color: '#DD0A2D',
    secondary_color: '#FFFFFF',
    players: [
      { name: 'Cleiton', position: 'Goleiro', jersey_number: 1 },
      { name: 'Lucão', position: 'Goleiro', jersey_number: 12 },
      { name: 'Léo Ortiz', position: 'Zagueiro', jersey_number: 3 },
      { name: 'Lucas Cunha', position: 'Zagueiro', jersey_number: 4 },
      { name: 'Luan Cândido', position: 'Zagueiro', jersey_number: 13 },
      { name: 'Juninho Capixaba', position: 'Lateral Esquerdo', jersey_number: 6 },
      { name: 'Guilherme', position: 'Lateral Esquerdo', jersey_number: 16 },
      { name: 'Andrés Hurtado', position: 'Lateral Direito', jersey_number: 2 },
      { name: 'Nathan', position: 'Lateral Direito', jersey_number: 22 },
      { name: 'Matheus Fernandes', position: 'Volante', jersey_number: 8 },
      { name: 'Eric Ramires', position: 'Volante', jersey_number: 5 },
      { name: 'Lucas Evangelista', position: 'Volante', jersey_number: 25 },
      { name: 'Bruninho', position: 'Meio Campo', jersey_number: 7 },
      { name: 'Helinho', position: 'Meio Campo', jersey_number: 10 },
      { name: 'Thiago Borbas', position: 'Meio Campo', jersey_number: 20 },
      { name: 'Henry Mosquera', position: 'Meio Campo', jersey_number: 11 },
      { name: 'Eduardo Sasha', position: 'Atacante', jersey_number: 9 },
      { name: 'Vitinho', position: 'Atacante', jersey_number: 19 },
      { name: 'Alerrandro', position: 'Atacante', jersey_number: 17 },
      { name: 'Lincoln', position: 'Atacante', jersey_number: 21 }
    ]
  },
  {
    name: 'Ponte Preta',
    coach_name: 'João Brigatti',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Associacao_Atletica_Ponte_Preta.svg/1024px-Associacao_Atletica_Ponte_Preta.svg.png',
    primary_color: '#000000',
    secondary_color: '#FFFFFF',
    players: [
      { name: 'Pedro Rocha', position: 'Goleiro', jersey_number: 1 },
      { name: 'Luiz Felipe', position: 'Goleiro', jersey_number: 12 },
      { name: 'Castro', position: 'Zagueiro', jersey_number: 3 },
      { name: 'Mateus Silva', position: 'Zagueiro', jersey_number: 4 },
      { name: 'Nilson Júnior', position: 'Zagueiro', jersey_number: 13 },
      { name: 'Igor Inocêncio', position: 'Lateral Esquerdo', jersey_number: 6 },
      { name: 'Gabriel Risso', position: 'Lateral Esquerdo', jersey_number: 16 },
      { name: 'Luiz Felipe', position: 'Lateral Direito', jersey_number: 2 },
      { name: 'Ramon Carvalho', position: 'Lateral Direito', jersey_number: 22 },
      { name: 'Felipinho', position: 'Volante', jersey_number: 8 },
      { name: 'Ramon', position: 'Volante', jersey_number: 5 },
      { name: 'Emerson Santos', position: 'Volante', jersey_number: 25 },
      { name: 'Elvis', position: 'Meio Campo', jersey_number: 7 },
      { name: 'Dodô', position: 'Meio Campo', jersey_number: 10 },
      { name: 'Gabriel Santiago', position: 'Meio Campo', jersey_number: 20 },
      { name: 'Iago Dias', position: 'Meio Campo', jersey_number: 11 },
      { name: 'Jeh', position: 'Atacante', jersey_number: 9 },
      { name: 'Élvis', position: 'Atacante', jersey_number: 19 },
      { name: 'Gabriel Novaes', position: 'Atacante', jersey_number: 17 },
      { name: 'Renato', position: 'Atacante', jersey_number: 21 }
    ]
  },
  {
    name: 'Guarani FC',
    coach_name: 'Umberto Louzer',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Guarani_FC.svg/1024px-Guarani_FC.svg.png',
    primary_color: '#006437',
    secondary_color: '#FFFFFF',
    players: [
      { name: 'Douglas Borges', position: 'Goleiro', jersey_number: 1 },
      { name: 'Vladimir', position: 'Goleiro', jersey_number: 12 },
      { name: 'Léo Santos', position: 'Zagueiro', jersey_number: 3 },
      { name: 'Rayan', position: 'Zagueiro', jersey_number: 4 },
      { name: 'Alan Santos', position: 'Zagueiro', jersey_number: 13 },
      { name: 'Hélder', position: 'Lateral Esquerdo', jersey_number: 6 },
      { name: 'Mayk', position: 'Lateral Esquerdo', jersey_number: 16 },
      { name: 'Diogo Mateus', position: 'Lateral Direito', jersey_number: 2 },
      { name: 'João Victor', position: 'Lateral Direito', jersey_number: 22 },
      { name: 'Anderson Leite', position: 'Volante', jersey_number: 8 },
      { name: 'Matheus Bueno', position: 'Volante', jersey_number: 5 },
      { name: 'Lucas Araújo', position: 'Volante', jersey_number: 25 },
      { name: 'Régis', position: 'Meio Campo', jersey_number: 7 },
      { name: 'Chay', position: 'Meio Campo', jersey_number: 10 },
      { name: 'Gustavo França', position: 'Meio Campo', jersey_number: 20 },
      { name: 'Reinaldo', position: 'Meio Campo', jersey_number: 11 },
      { name: 'Pablo Thomaz', position: 'Atacante', jersey_number: 9 },
      { name: 'Reinaldo', position: 'Atacante', jersey_number: 19 },
      { name: 'Bruno José', position: 'Atacante', jersey_number: 17 },
      { name: 'Derek', position: 'Atacante', jersey_number: 21 }
    ]
  },
  {
    name: 'Botafogo-SP',
    coach_name: 'Paulo Gomes',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Botafogo_Ribeirao_Preto_SP.png/461px-Botafogo_Ribeirao_Preto_SP.png',
    primary_color: '#FF0000',
    secondary_color: '#000000',
    players: [
      { name: 'João Carlos', position: 'Goleiro', jersey_number: 1 },
      { name: 'Matheus Albino', position: 'Goleiro', jersey_number: 12 },
      { name: 'Bernardo Schappo', position: 'Zagueiro', jersey_number: 3 },
      { name: 'Lucas Dias', position: 'Zagueiro', jersey_number: 4 },
      { name: 'Fábio Sanches', position: 'Zagueiro', jersey_number: 13 },
      { name: 'Jean', position: 'Lateral Esquerdo', jersey_number: 6 },
      { name: 'Patrick Brey', position: 'Lateral Esquerdo', jersey_number: 16 },
      { name: 'Wallison', position: 'Lateral Direito', jersey_number: 2 },
      { name: 'Thassio', position: 'Lateral Direito', jersey_number: 22 },
      { name: 'Tárik', position: 'Volante', jersey_number: 8 },
      { name: 'Carlos Manuel', position: 'Volante', jersey_number: 5 },
      { name: 'Matheus Barbosa', position: 'Volante', jersey_number: 25 },
      { name: 'Douglas Baggio', position: 'Meio Campo', jersey_number: 7 },
      { name: 'Alex Sandro', position: 'Meio Campo', jersey_number: 10 },
      { name: 'Jean Victor', position: 'Meio Campo', jersey_number: 20 },
      { name: 'Leandro Maciel', position: 'Meio Campo', jersey_number: 11 },
      { name: 'Tiago Alves', position: 'Atacante', jersey_number: 9 },
      { name: 'Toró', position: 'Atacante', jersey_number: 19 },
      { name: 'Emerson Negueba', position: 'Atacante', jersey_number: 17 },
      { name: 'Lucas Cardoso', position: 'Atacante', jersey_number: 21 }
    ]
  },
  {
    name: 'Ituano FC',
    coach_name: 'Marcinho Freitas',
    logo_url: 'https://upload.wikimedia.org/wikinews/pt/thumb/a/a0/Ituano_logo.svg/1200px-Ituano_logo.svg.png',
    primary_color: '#FF0000',
    secondary_color: '#000000',
    players: [
      { name: 'Jefferson Paulino', position: 'Goleiro', jersey_number: 1 },
      { name: 'Helton', position: 'Goleiro', jersey_number: 12 },
      { name: 'Marcel', position: 'Zagueiro', jersey_number: 3 },
      { name: 'Claudinho', position: 'Zagueiro', jersey_number: 4 },
      { name: 'João Vialle', position: 'Zagueiro', jersey_number: 13 },
      { name: 'Léo Duarte', position: 'Lateral Esquerdo', jersey_number: 6 },
      { name: 'Jonathan Silva', position: 'Lateral Esquerdo', jersey_number: 16 },
      { name: 'Léo Oliveira', position: 'Lateral Direito', jersey_number: 2 },
      { name: 'Vinícius Paiva', position: 'Lateral Direito', jersey_number: 22 },
      { name: 'José Aldo', position: 'Volante', jersey_number: 8 },
      { name: 'Eduardo Person', position: 'Volante', jersey_number: 5 },
      { name: 'Yann Rolim', position: 'Volante', jersey_number: 25 },
      { name: 'Thonny Anderson', position: 'Meio Campo', jersey_number: 7 },
      { name: 'Eduardo Person', position: 'Meio Campo', jersey_number: 10 },
      { name: 'Pablo', position: 'Meio Campo', jersey_number: 20 },
      { name: 'Matheus Cadorini', position: 'Meio Campo', jersey_number: 11 },
      { name: 'Matheus Maia', position: 'Atacante', jersey_number: 9 },
      { name: 'Marlon', position: 'Atacante', jersey_number: 19 },
      { name: 'Matheus Maia', position: 'Atacante', jersey_number: 17 },
      { name: 'Wesley', position: 'Atacante', jersey_number: 21 }
    ]
  },
  {
    name: 'XV de Piracicaba',
    coach_name: 'Cléber Gaúcho',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Esporte_Clube_XV_de_Novembro_%28Piracicaba%29.svg/1024px-Esporte_Clube_XV_de_Novembro_%28Piracicaba%29.svg.png',
    primary_color: '#000000',
    secondary_color: '#FFFFFF',
    players: [
      { name: 'Athiley', position: 'Goleiro', jersey_number: 1 },
      { name: 'Bruno Lopes', position: 'Goleiro', jersey_number: 12 },
      { name: 'Luis Ricardo', position: 'Zagueiro', jersey_number: 3 },
      { name: 'Diego Tavares', position: 'Zagueiro', jersey_number: 4 },
      { name: 'Guilherme Teixeira', position: 'Zagueiro', jersey_number: 13 },
      { name: 'Rodrigo Arroz', position: 'Lateral Esquerdo', jersey_number: 6 },
      { name: 'João Victor', position: 'Lateral Esquerdo', jersey_number: 16 },
      { name: 'Jonas', position: 'Lateral Direito', jersey_number: 2 },
      { name: 'Felipe Marques', position: 'Lateral Direito', jersey_number: 22 },
      { name: 'Wendel', position: 'Volante', jersey_number: 8 },
      { name: 'Xavier', position: 'Volante', jersey_number: 5 },
      { name: 'Guilherme Madruga', position: 'Volante', jersey_number: 25 },
      { name: 'Gabriel Poveda', position: 'Meio Campo', jersey_number: 7 },
      { name: 'Felipe Marques', position: 'Meio Campo', jersey_number: 10 },
      { name: 'Gustavo Vintecinco', position: 'Meio Campo', jersey_number: 20 },
      { name: 'Rafhael Lucas', position: 'Meio Campo', jersey_number: 11 },
      { name: 'Roger', position: 'Atacante', jersey_number: 9 },
      { name: 'Popó', position: 'Atacante', jersey_number: 19 },
      { name: 'Bill', position: 'Atacante', jersey_number: 17 },
      { name: 'Iago Telles', position: 'Atacante', jersey_number: 21 }
    ]
  }
];

// Function to generate random birth date between 18 and 35 years ago
function generateBirthDate() {
  const start = new Date();
  start.setFullYear(start.getFullYear() - 35);
  const end = new Date();
  end.setFullYear(end.getFullYear() - 18);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
}

export async function seedChampionshipData() {
  try {
    // Get the current user's ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Usuário não autenticado');

    // Create championship
    const { data: championship, error: championshipError } = await supabase
      .from('championships')
      .insert([{
        ...CHAMPIONSHIP,
        organizer_id: user.id
      }])
      .select()
      .single();

    if (championshipError) throw championshipError;

    // Create teams and their players
    for (const team of TEAMS) {
      const { players, ...teamData } = team;
      
      // Create team
      const { data: createdTeam, error: teamError } = await supabase
        .from('teams')
        .insert([{
          ...teamData,
          championship_id: championship.id
        }])
        .select()
        .single();

      if (teamError) throw teamError;

      // Create players for the team
      const playersWithBirthDates = players.map(player => ({
        ...player,
        birth_date: generateBirthDate(),
        team_id: createdTeam.id
      }));

      const { error: playersError } = await supabase
        .from('players')
        .insert(playersWithBirthDates);

      if (playersError) throw playersError;
    }

    return championship.id;
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
}