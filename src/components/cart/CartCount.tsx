"use client";

import React, { useEffect, useState } from 'react';
import { useCartStore } from '../../store/cart';

export function CartCount() {
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by only rendering the count on the client
  if (!mounted) {
    return <span>Cart (0)</span>;
  }

  return <span>Cart ({getTotalItems()})</span>;
}
