import {
  Croissant,
  CupSoda,
  Grid2X2,
  Leaf,
  Menu,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  SprayCan,
  Store,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "../lib/format";
import type { CartSummary, Category, Product } from "../types";
import { ProductImage } from "./ProductImage";

interface CatalogProps {
  products: Product[];
  allProducts: Product[];
  selectedCategory: Category | "Todos";
  searchTerm: string;
  cartSummary: CartSummary;
  quantities: Record<string, number>;
  onCategoryChange: (category: Category | "Todos") => void;
  onSearchChange: (value: string) => void;
  onAddProduct: (product: Product) => void;
  onDecrementProduct: (productId: string) => void;
  onOpenCheckout: () => void;
}

export function Catalog({
  products,
  allProducts,
  selectedCategory,
  searchTerm,
  cartSummary,
  quantities,
  onCategoryChange,
  onSearchChange,
  onAddProduct,
  onDecrementProduct,
  onOpenCheckout,
}: CatalogProps) {
  const [isSectionsMenuOpen, setIsSectionsMenuOpen] = useState(false);
  const sectionItems = getSectionItems(allProducts);
  const sectionProductGroups = getSectionProductGroups(allProducts);
  const showHomeSections = selectedCategory === "Todos" && searchTerm.trim() === "";

  function handleSectionSelect(category: Category | "Todos") {
    onCategoryChange(category);
    setIsSectionsMenuOpen(false);
  }

  return (
    <main className="screen catalog-screen">
      <header className="app-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            <Store size={22} />
          </span>
          <div>
            <p className="greeting">Ola, cliente</p>
            <h1>Mercadinho</h1>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="icon-button menu-button"
            type="button"
            onClick={() => setIsSectionsMenuOpen(true)}
            aria-label="Abrir menu de secoes"
            aria-controls="sections-drawer"
            aria-expanded={isSectionsMenuOpen}
          >
            <Menu size={19} />
          </button>
          <button
            className="cart-pill"
            type="button"
            onClick={onOpenCheckout}
            aria-label="Abrir checkout"
            disabled={cartSummary.itemCount === 0}
          >
            <ShoppingBag size={18} />
            <span>{cartSummary.itemCount}</span>
          </button>
        </div>
      </header>

      <label className="search-box">
        <Search size={18} />
        <input
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar produtos"
        />
      </label>

      {isSectionsMenuOpen ? (
        <div
          className="sections-menu-overlay"
          onClick={() => setIsSectionsMenuOpen(false)}
        >
          <aside
            className="sections-drawer"
            id="sections-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de secoes"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sections-drawer-header">
              <div>
                <span>Secoes</span>
                <h2>Escolha uma secao</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setIsSectionsMenuOpen(false)}
                aria-label="Fechar menu de secoes"
              >
                <X size={18} />
              </button>
            </div>

            <div className="sections-drawer-list">
              {sectionItems.map((section) => (
                <button
                  key={section.category}
                  type="button"
                  className={
                    section.category === selectedCategory
                      ? "drawer-section-item active"
                      : "drawer-section-item"
                  }
                  onClick={() => handleSectionSelect(section.category)}
                  aria-label={`Abrir secao ${section.category}`}
                >
                  <span className="section-icon" aria-hidden="true">
                    <section.Icon size={18} />
                  </span>
                  <span>{section.label}</span>
                  <strong>{section.count} itens</strong>
                </button>
              ))}
            </div>
          </aside>
        </div>
      ) : null}

      {showHomeSections ? (
        <section className="section-product-groups" aria-label="Produtos por secao">
          {sectionProductGroups.map((group) => (
            <section
              className="product-section"
              aria-label={`Produtos de ${group.category}`}
              key={group.category}
            >
              <div className="product-section-header">
                <h2>{group.category}</h2>
                <span>{group.products.length} itens</span>
              </div>
              <div className="product-rail">
                {group.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantity={quantities[product.id] ?? 0}
                    onAddProduct={onAddProduct}
                    onDecrementProduct={onDecrementProduct}
                  />
                ))}
              </div>
            </section>
          ))}
        </section>
      ) : (
        <section className="product-grid" aria-label="Produtos">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              quantity={quantities[product.id] ?? 0}
              onAddProduct={onAddProduct}
              onDecrementProduct={onDecrementProduct}
            />
          ))}
        </section>
      )}

      {cartSummary.itemCount > 0 ? (
        <section className="catalog-checkout-bar" aria-label="Resumo do checkout">
          <div>
            <span>{cartSummary.itemCount} itens</span>
            <strong>{formatCurrency(cartSummary.totalCents)}</strong>
          </div>
          <button type="button" onClick={onOpenCheckout}>
            Checkout
          </button>
        </section>
      ) : null}
    </main>
  );
}

interface ProductCardProps {
  product: Product;
  quantity: number;
  onAddProduct: (product: Product) => void;
  onDecrementProduct: (productId: string) => void;
}

function ProductCard({
  product,
  quantity,
  onAddProduct,
  onDecrementProduct,
}: ProductCardProps) {
  return (
    <article className="product-card">
      <div className="product-media">
        <ProductImage
          product={product}
          imageTestId={`product-image-${product.id}`}
          fallbackTestId={`product-image-fallback-${product.id}`}
        />
        {quantity > 0 ? (
          <div className="product-stepper" aria-label={`Quantidade de ${product.name}`}>
            <button
              type="button"
              onClick={() => onDecrementProduct(product.id)}
              aria-label={`Diminuir ${product.name}`}
            >
              <Minus size={13} />
            </button>
            <strong>{quantity}</strong>
            <button
              type="button"
              onClick={() => onAddProduct(product)}
              aria-label={`Adicionar ${product.name}`}
            >
              <Plus size={13} />
            </button>
          </div>
        ) : (
          <button
            className="add-button"
            type="button"
            onClick={() => onAddProduct(product)}
            aria-label={`Adicionar ${product.name}`}
          >
            <Plus size={18} strokeWidth={3} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="product-info">
        <h3>{product.name}</h3>
        <p>{product.unit}</p>
        <strong>{formatCurrency(product.priceCents)}</strong>
      </div>
    </article>
  );
}

const sectionIconByCategory: Record<string, LucideIcon> = {
  Todos: Grid2X2,
  Hortifruti: Leaf,
  Padaria: Croissant,
  Bebidas: CupSoda,
  Mercearia: Package,
  Limpeza: SprayCan,
};

function getCategories(products: Product[]) {
  return Array.from(new Set(products.map((product) => product.category).filter(Boolean)));
}

function getSectionItems(products: Product[]) {
  const categories = getCategories(products);
  return (["Todos", ...categories] as Array<Category | "Todos">).map((category) => ({
    category,
    label: category,
    count:
      category === "Todos"
        ? products.length
        : products.filter((product) => product.category === category).length,
    Icon: sectionIconByCategory[category] ?? Package,
  }));
}

function getSectionProductGroups(products: Product[]) {
  return getCategories(products).map((category) => ({
    category,
    products: products.filter((product) => product.category === category),
  }));
}
