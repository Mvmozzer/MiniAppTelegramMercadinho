import { Package } from "lucide-react";
import { useEffect, useState } from "react";
import type { Product } from "../types";

interface ProductImageProps {
  product: Product;
  imageTestId: string;
  fallbackTestId: string;
}

export function ProductImage({ product, imageTestId, fallbackTestId }: ProductImageProps) {
  const [failed, setFailed] = useState(!product.image);

  useEffect(() => {
    setFailed(!product.image);
  }, [product.image]);

  if (failed) {
    return (
      <span className="product-image-fallback" data-testid={fallbackTestId} aria-hidden="true">
        <Package size={22} />
      </span>
    );
  }

  return (
    <img
      data-testid={imageTestId}
      src={product.image}
      alt=""
      loading="eager"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
