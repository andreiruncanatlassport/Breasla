/**
 * Alege `cate` elemente dintr-o lista, cu o rotatie care se schimba periodic
 * (la ~15 min), pentru varietate pe pagina principala fara sa afisezi mereu
 * aceleasi firme. Determinist per fereastra de timp (nu foloseste Math.random
 * in render — citirea timpului e izolata aici, in afara componentei React).
 */
export function alegeFirmeRotativ<T>(lista: T[], cate: number): T[] {
  if (lista.length <= cate) return lista;
  const seed = Math.floor(Date.now() / (1000 * 60 * 15));
  const pseudoRandom = (n: number) => {
    const x = Math.sin(n + seed) * 10000;
    return x - Math.floor(x);
  };
  return lista
    .map((item, i) => ({ item, sort: pseudoRandom(i) }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, cate)
    .map(({ item }) => item);
}
