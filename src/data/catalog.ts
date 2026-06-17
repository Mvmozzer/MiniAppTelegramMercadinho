import type { Category, Product } from "../types";

export const categories: Category[] = ["Hortifruti", "Padaria", "Bebidas", "Mercearia", "Limpeza"];

export const catalog: Product[] = [
  {
    id: "banana-prata",
    name: "Banana prata",
    category: "Hortifruti",
    unit: "kg",
    priceCents: 499,
    image: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=320&q=80",
    description: "Banana fresca selecionada.",
  },
  {
    id: "tomate-italiano",
    name: "Tomate italiano",
    category: "Hortifruti",
    unit: "kg",
    priceCents: 799,
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=320&q=80",
    description: "Ideal para saladas e molho.",
  },
  {
    id: "pao-frances",
    name: "Pao frances",
    category: "Padaria",
    unit: "un",
    priceCents: 90,
    image: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=320&q=80",
    description: "Assado no dia.",
  },
  {
    id: "bolo-cenoura",
    name: "Bolo de cenoura",
    category: "Padaria",
    unit: "fatia",
    priceCents: 690,
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=320&q=80",
    description: "Com cobertura de chocolate.",
  },
  {
    id: "leite-integral",
    name: "Leite integral",
    category: "Bebidas",
    unit: "1L",
    priceCents: 599,
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=320&q=80",
    description: "Caixa longa vida.",
  },
  {
    id: "suco-laranja",
    name: "Suco de laranja",
    category: "Bebidas",
    unit: "1L",
    priceCents: 1190,
    image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=320&q=80",
    description: "Pronto para beber.",
  },
  {
    id: "arroz-tipo-1",
    name: "Arroz tipo 1",
    category: "Mercearia",
    unit: "5kg",
    priceCents: 2290,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=320&q=80",
    description: "Pacote familiar.",
  },
  {
    id: "feijao-carioca",
    name: "Feijao carioca",
    category: "Mercearia",
    unit: "1kg",
    priceCents: 899,
    image: "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=320&q=80",
    description: "Graos selecionados.",
  },
  {
    id: "detergente-neutro",
    name: "Detergente neutro",
    category: "Limpeza",
    unit: "500ml",
    priceCents: 299,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=320&q=80",
    description: "Para loucas e superficies.",
  },
  {
    id: "sabao-po",
    name: "Sabao em po",
    category: "Limpeza",
    unit: "800g",
    priceCents: 1290,
    image: "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=320&q=80",
    description: "Rende ate 10 lavagens.",
  },
];

export function findProduct(productId: string): Product | undefined {
  return catalog.find((product) => product.id === productId);
}
