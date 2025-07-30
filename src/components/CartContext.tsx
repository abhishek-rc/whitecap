'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartProduct {
  product: any;
  quantity: number;
}

interface CartContextType {
  cart: CartProduct[];
  addToCart: (product: any, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  // Initialize cart as empty to avoid hydration mismatch
  const [cart, setCart] = useState<CartProduct[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage after component mounts (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cart');
      if (stored) {
        try {
          setCart(JSON.parse(stored));
        } catch (error) {
          console.error('Error parsing cart from localStorage:', error);
        }
      }
      setIsLoaded(true);
    }
  }, []);

  // Save cart to localStorage whenever it changes (but only after initial load)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  const addToCart = (product: any, quantity: number = 1) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.product.id === product.id);
      if (idx !== -1) {
        // Already in cart, update quantity
        const updated = [...prev];
        updated[idx].quantity += quantity;
        return updated;
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity } : item));
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
