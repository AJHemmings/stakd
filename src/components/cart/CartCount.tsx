"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useCartStore } from '../../store/cart';

export function CartCount() {
  const count = useCartStore((state) => state.items.reduce((t, i) => t + i.quantity, 0));
  const [mounted, setMounted] = useState(false);
  const [bumping, setBumping] = useState(false);
  const prevCount = useRef(0);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (count > prevCount.current) {
      setBumping(true);
      const t = setTimeout(() => setBumping(false), 400);
      prevCount.current = count;
      return () => clearTimeout(t);
    }
    prevCount.current = count;
  }, [count, mounted]);

  if (!mounted) return <span>Cart (0)</span>;

  return <span className={bumping ? 'cart-bump' : ''}>Cart ({count})</span>;
}
