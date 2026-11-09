/**
 * Avaliações de exemplo, gravadas quando a tabela está vazia. Os movieId são
 * os filmes iniciais do microsserviço de filmes (ids fixos).
 */
const movie = (n) => `4f3c2a1e-000${n}-4b8e-9f00-00000000000${n}`;

export const reviewsSeed = Object.freeze([
  { id: "9a0c7e52-0001-4d1a-8c00-000000000001", movieId: movie(1), author: "Ana", rating: 9, comment: "Visual impressionante e trilha sonora marcante." },
  { id: "9a0c7e52-0002-4d1a-8c00-000000000002", movieId: movie(1), author: "Bruno", rating: 10, comment: "Melhor ficção científica que já vi." },
  { id: "9a0c7e52-0003-4d1a-8c00-000000000003", movieId: movie(2), author: "Carla", rating: 8, comment: "Roteiro complexo, vale assistir duas vezes." },
  { id: "9a0c7e52-0004-4d1a-8c00-000000000004", movieId: movie(3), author: "Diego", rating: 9, comment: "Revolucionou os efeitos especiais." },
  { id: "9a0c7e52-0005-4d1a-8c00-000000000005", movieId: movie(3), author: "Elisa", rating: 8, comment: null },
  { id: "9a0c7e52-0006-4d1a-8c00-000000000006", movieId: movie(3), author: "Fábio", rating: 10, comment: "Clássico absoluto." },
  { id: "9a0c7e52-0007-4d1a-8c00-000000000007", movieId: movie(4), author: "Gabi", rating: 10, comment: "Atuações históricas." },
  { id: "9a0c7e52-0008-4d1a-8c00-000000000008", movieId: movie(5), author: "Hugo", rating: 7, comment: "Divertido para toda a família." },
  { id: "9a0c7e52-0009-4d1a-8c00-000000000009", movieId: movie(5), author: "Iara", rating: 8, comment: "Emocionante." }
]);
