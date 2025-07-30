'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/CartContext';
import RecommendationsWidget from '@/components/RecommendationsWidget';

function getCurrentVisitorId(selectedUserId: string | null): string {
  const DEMO_USERS = [
    { id: "tahir", name: "Tahir", visitorId: "42111579-af5d-4c39-a2e3-eea9baeeb985" },
    { id: "tahsin", name: "Tahsin", visitorId: "29b74c36-1c2b-4c73-92d9-c89b717fb1cb" },
    { id: "pooja", name: "Pooja", visitorId: "dd8e0ccc-9a95-4662-bdc3-208f708d8f4e" },
    { id: "mahveer", name: "Mahveer", visitorId: "40f2c915-d265-4312-b618-31c969b56cdb" },
  ];
  const getOrCreateVisitorId = () => {
    if (typeof window === 'undefined') return 'widget-user';
    let id = localStorage.getItem('visitorId');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('visitorId', id);
    }
    return id;
  };
  return selectedUserId
    ? DEMO_USERS.find(user => user.id === selectedUserId)?.visitorId || getOrCreateVisitorId()
    : getOrCreateVisitorId();
}

import Image from 'next/image';

// Demo user logic (reuse from homepage)
const DEMO_USERS = [
  { id: "tahir", name: "Tahir", visitorId: "42111579-af5d-4c39-a2e3-eea9baeeb985" },
  { id: "tahsin", name: "Tahsin", visitorId: "29b74c36-1c2b-4c73-92d9-c89b717fb1cb" },
  { id: "pooja", name: "Pooja", visitorId: "dd8e0ccc-9a95-4662-bdc3-208f708d8f4e" },
  { id: "mahveer", name: "Mahveer", visitorId: "40f2c915-d265-4312-b618-31c969b56cdb" },
];
function getStoredDemoUserId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('demoUserId');
}
function setStoredDemoUserId(id: string | null) {
  if (typeof window === 'undefined') return;
  if (id) localStorage.setItem('demoUserId', id);
  else localStorage.removeItem('demoUserId');
}

const CartPage = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  useEffect(() => {
    const stored = getStoredDemoUserId();
    if (stored) setSelectedUserId(stored);
  }, []);
  useEffect(() => {
    setStoredDemoUserId(selectedUserId);
  }, [selectedUserId]);

  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price || 0) * item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - copied from homepage */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center group">
                <h1 className="text-2xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">Whitecap</h1>
              </Link>
              <span className="ml-2 text-sm text-gray-800">Search & Discovery</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-900">Vertex AI POC</span>
              <div>
                <label htmlFor="demo-user-dropdown" className="text-xs mr-1 text-gray-900">Demo User:</label>
                <select
                  id="demo-user-dropdown"
                  className="border border-gray-800 text-gray-800 rounded px-2 py-1 text-sm focus:ring-gray-800 focus:border-gray-800"
                  value={selectedUserId || ""}
                  onChange={e => setSelectedUserId(e.target.value || null)}
                >
                  <option value="" className="text-gray-900">(No user selected)</option>
                  {DEMO_USERS.map(user => (
                    <option key={user.id} value={user.id} className="text-gray-900">{user.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Your Cart</h1>
      {cart.length === 0 ? (
        <div className="text-gray-800 text-center py-20">
          <p>Your cart is empty.</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-gray-200">
            {cart.map(({ product, quantity }) => (
              <div key={product.id} className="flex items-center p-4">
                <div className="w-20 h-20 relative mr-4">
                  {product.imageURL ? (
                    <Image src={product.imageURL} alt={product.displayName} fill className="object-cover rounded" />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 flex items-center justify-center rounded" />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="font-medium text-lg text-gray-900">{product.displayName}</h2>
                  <p className="text-xs text-gray-800 mb-1">SKU: {product.sku}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center border rounded px-2">
                      <button
                        className="px-2 py-1 text-gray-600 hover:text-blue-600 focus:outline-none"
                        onClick={() => updateQuantity(product.id, Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >-</button>
                      <span className="mx-2 text-gray-900">{quantity}</span>
                      <button
                        className="px-2 py-1 text-gray-600 hover:text-blue-600 focus:outline-none"
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                      >+</button>
                    </div>
                    <button
                      className="text-red-700 hover:underline text-xs"
                      onClick={() => removeFromCart(product.id)}
                    >Remove</button>
                  </div>
                </div>
                <div className="text-right min-w-[80px]">
                  <div className="font-semibold text-gray-900">${(product.price * quantity).toFixed(2)}</div>
                  <div className="text-xs text-gray-800">${product.price.toFixed(2)} each</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-6 bg-gray-50 p-4 rounded">
            <span className="font-semibold text-lg text-gray-900">Subtotal</span>
            <span className="font-bold text-xl text-blue-700">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-end mt-4">
            <button
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 mr-2"
              onClick={clearCart}
            >Clear Cart</button>
            <button
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
              disabled={cart.length === 0}
              onClick={async () => {
                await fetch('/api/user-event', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    eventType: 'checkout',
                    cart: cart.map(({ product, quantity }) => ({
                      productId: product.id,
                      quantity,
                      price: product.price
                    })),
                    subtotal
                  })
                });
              }}
            >Checkout</button>
          </div>
          {/* Recommendations below cart */}
          <div className="mt-10">
            {cart.length > 0 && (
              <RecommendationsWidget
                productSku={cart[0].product.sku}
                categories={[cart[0].product.category, cart[0].product.webCategory].filter(Boolean)}
                userId={selectedUserId || undefined}
                visitorId={getCurrentVisitorId(selectedUserId)}
                limit={8}
              />
            )}
          </div>
        </>
      )}
      </div>
    </div>
  );
};

export default CartPage;
