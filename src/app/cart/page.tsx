'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/CartContext';
import RecommendationsWidget from '@/components/RecommendationsWidget';

// Demo user logic (reuse from homepage)
const DEMO_USERS = [
  { id: "tahir", name: "Tahir", visitorId: "160463000" },
  { id: "tahsin", name: "Tahsin", visitorId: "95375000" },
  { id: "pooja", name: "Pooja", visitorId: "10000005743" },
  { id: "mahveer", name: "Mahveer", visitorId: "59092000" },
];

function getCurrentVisitorId(selectedUserId: string | null): string {
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
  
  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId || null);
  };

  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price || 0) * item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Header */}
          <div className="hidden md:flex justify-between items-center">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <img src="https://d2ou5j4j4yi9kl.cloudfront.net/userfiles/header/whitecap_header_logo.png" alt="WhiteCap Logo" className="h-10" />
              </Link>
            </div>
            <div className="flex items-center space-x-4 lg:space-x-6">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search by name, brand, product id..." 
                  className="w-48 text-white sm:w-64 lg:w-80 pl-3 pr-12 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-gray-800"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      window.location.href = `/search?q=${encodeURIComponent((e.target as HTMLInputElement).value)}${selectedUserId ? `&userId=${selectedUserId}` : ''}`;
                    }
                  }}
                />
                <button 
                  className="absolute inset-y-0 right-0 px-3 bg-yellow-500 rounded-r-md flex items-center justify-center hover:bg-yellow-600 transition-colors"
                  onClick={() => {
                    const input = document.querySelector('.hidden.md\:flex input[type="text"]') as HTMLInputElement;
                    if (input) {
                      window.location.href = `/search?q=${encodeURIComponent(input.value || '')}${selectedUserId ? `&userId=${selectedUserId}` : ''}`;
                    }
                  }}
                >
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
              <a href="#" className="text-white hover:text-gray-300 flex items-center whitespace-nowrap">
                <svg className="h-5 w-5 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Sign In</span>
              </a>
              <div className="flex items-center text-white hover:text-gray-300 whitespace-nowrap">
                <svg className="h-5 w-5 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-xs text-white">Selected Branch</span>
                  <div className="flex items-center">
                    <span className="text-white text-sm font-medium">Birmingham - </span>
                    <select
                      value={selectedUserId || ''}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="appearance-none bg-transparent text-sm font-medium focus:outline-none text-white"
                    >
                      <option value="" className="text-gray-900">Guest</option>
                      {DEMO_USERS.map((user) => (
                        <option key={user.id} value={user.id} className="text-gray-900">
                          {user.name}
                        </option>
                      ))}
                    </select>
                    <svg className="h-4 w-4 text-white ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div 
                onClick={() => window.location.href = '/cart'} 
                className="flex items-center text-white hover:text-gray-300 cursor-pointer whitespace-nowrap"
              >
                <div className="relative">
                  <svg className="h-6 w-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.reduce((total, item) => total + item.quantity, 0)}
                  </span>
                </div>
                <span className="ml-1 font-medium">CART</span>
              </div>
            </div>
          </div>
          
          {/* Mobile Header */}
          <div className="md:hidden">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Link href="/" className="flex items-center">
                  <img src="https://d2ou5j4j4yi9kl.cloudfront.net/userfiles/header/whitecap_header_logo.png" alt="WhiteCap Logo" className="h-8" />
                </Link>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Cart Icon - Always visible on mobile */}
                <div 
                  onClick={() => window.location.href = '/cart'} 
                  className="flex items-center text-white hover:text-gray-300 cursor-pointer"
                >
                  <div className="relative">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cart.reduce((total, item) => total + item.quantity, 0)}
                    </span>
                  </div>
                </div>
                
                {/* Mobile Menu Button */}
                <button 
                  onClick={() => {
                    const mobileMenu = document.getElementById('mobile-menu');
                    if (mobileMenu) {
                      mobileMenu.classList.toggle('hidden');
                    }
                  }}
                  className="text-white p-2"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Mobile Menu - Hidden by default */}
            <div id="mobile-menu" className="hidden pt-4 pb-2">
              {/* Mobile Search */}
              <div className="relative mb-4">
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  className="w-full pl-3 pr-12 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-gray-800"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      window.location.href = `/search?q=${encodeURIComponent((e.target as HTMLInputElement).value)}${selectedUserId ? `&userId=${selectedUserId}` : ''}`;
                    }
                  }}
                />
                <button 
                  className="absolute inset-y-0 right-0 px-3 bg-yellow-500 rounded-r-md flex items-center justify-center hover:bg-yellow-600 transition-colors"
                  onClick={() => {
                    const input = document.querySelector('#mobile-menu input[type="text"]') as HTMLInputElement;
                    if (input) {
                      window.location.href = `/search?q=${encodeURIComponent(input.value || '')}${selectedUserId ? `&userId=${selectedUserId}` : ''}`;
                    }
                  }}
                >
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
              
              {/* Mobile Menu Items */}
              <div className="space-y-3">
                <a href="#" className="flex items-center text-white hover:text-gray-300 py-2">
                  <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Sign In</span>
                </a>
                
                <div className="py-2">
                  <div className="flex items-center text-white mb-1">
                    <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm">Selected Branch</span>
                  </div>
                  <div className="pl-8">
                    <select
                      value={selectedUserId || ''}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full appearance-none bg-gray-800 text-white py-1 px-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    >
                      <option value="" className="text-gray-900">Guest</option>
                      {DEMO_USERS.map((user) => (
                        <option key={user.id} value={user.id} className="text-gray-900">
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Cart</h1>
          <div className="flex space-x-4">
            <button
              className="px-6 py-2 bg-yellow-500 text-black font-semibold rounded hover:bg-yellow-600"
              disabled={cart.length === 0}
            >
              SAVE ORDER
            </button>
            <button className="p-2">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="text-lg">{cart.length} {cart.length === 1 ? 'Item' : 'Items'}</div>
          <button 
            className="text-blue-600 hover:text-blue-800 font-medium"
            onClick={clearCart}
          >
            Remove All
          </button>
        </div>
        
        <div className="flex flex-wrap">
          <div className="w-full lg:w-3/4 pr-0 lg:pr-6">
            {cart.length === 0 ? (
              <div className="text-gray-800 text-center py-20 border-t border-gray-200">
                <p>Your cart is empty.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 border-t border-gray-200">
                {cart.map(({ product, quantity }) => (
                  <div key={product.id} className="py-6 relative border-b border-gray-200 last:border-b-0">
                    <div className="flex items-center">
                      <div className="w-24 h-24 relative mr-6">
                        {product.imageURL ? (
                          <Image src={product.imageURL} alt={product.displayName} fill className="object-contain" />
                        ) : (
                          <div className="w-24 h-24 bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-400">No image</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex flex-col">
                          <div className="text-blue-600 font-medium">
                            {product.brand || 'Werner'}
                          </div>
                          <h2 className="font-medium text-lg text-gray-900">{product.displayName || 'Werner Pump Jack Only'}</h2>
                          
                          <div className="mt-1">
                            <div className="flex space-x-6">
                              <div className="text-sm text-gray-600">SKU#<span className="font-bold">{product.sku || '104PJ'}</span></div>
                              <div className="text-sm text-gray-600">MFG#<span className="font-bold">{(product as any).manufacturerSku || 'SPJ100'}</span></div>
                            </div>
                          </div>
                          
                          <div className="mt-1 flex items-center">
                            <svg className="h-4 w-4 text-green-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-600">In Stock</span>
                          </div>
                          
                          <div className="mt-1">
                            <button
                              className="text-blue-600 hover:underline text-sm"
                              onClick={() => {}}
                            >
                              Add to List
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end min-w-[200px] pr-8">
                        <div>
                          <div className="text-sm text-gray-600 text-right mb-1">PRICE</div>
                          <div className="font-bold text-xl text-gray-900 text-right">${(product.price || 206.19).toFixed(2)}</div>
                          <div className="text-sm text-gray-600 text-right">${(product.price || 206.19).toFixed(2)} (EACH)</div>
                        </div>
                        
                        <div className="mt-4">
                          <div className="text-sm text-gray-600 mb-1 text-right">QTY</div>
                          <div className="flex justify-end">
                            <input 
                              type="number" 
                              min="1" 
                              value={quantity} 
                              onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 1)}
                              className="border border-gray-300 rounded w-20 px-2 py-1 text-center"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Remove button (X) */}
                    <button
                      className="absolute top-6 right-0 text-gray-400 hover:text-gray-600"
                      onClick={() => removeFromCart(product.id)}
                      aria-label="Remove item"
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-center mt-8">
              <button
                className="px-6 py-2 border border-yellow-500 rounded text-gray-700 hover:bg-yellow-50 font-medium"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                BACK TO TOP
              </button>
            </div>
          </div>
          
          {/* Right sidebar with branch info and order summary */}
          <div className="w-full lg:w-1/4 mt-8 lg:mt-0">
            <div className="bg-gray-50 p-4 rounded mb-6">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium">Selected Branch</div>
                <button className="text-blue-600 hover:text-blue-800 text-sm">Change</button>
              </div>
              <div className="text-sm">
                <p className="font-medium">White Cap - Ecommerce 594</p>
                <p>4500 5th Ave South</p>
                <p>Building M4</p>
                <p>Birmingham, AL 35222</p>
                <p>(205) 714-3395</p>
              </div>
            </div>
            
            {cart.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between py-2">
                  <span>Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Estimated Shipping</span>
                  <span className="text-amber-700">TBD</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Estimated Tax</span>
                  <span className="text-amber-700">TBD</span>
                </div>
                <div className="flex justify-between py-2 font-bold border-t border-gray-200 mt-2 pt-2">
                  <span>Total</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                
                <div className="mt-6 space-y-3">
                  <button
                    className="w-full py-3 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-600 transition-colors"
                    disabled={cart.length === 0}
                  >
                    CHECKOUT
                  </button>
                  
                  <button
                    className="w-full py-3 bg-white border border-yellow-500 text-black font-bold rounded hover:bg-yellow-50 transition-colors"
                    disabled={cart.length === 0}
                  >
                    SAVE ORDER
                  </button>
                  
                  <p className="text-center text-sm text-gray-600 mt-2">Orders ship in 1-3 business days</p>
                </div>
              </div>
            )}
          </div>
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
      </div>
      <footer className="bg-black text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Logo and Contact */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div className="mb-6 md:mb-0">
              <img src="https://d2ou5j4j4yi9kl.cloudfront.net/userfiles/header/whitecap_header_logo.png" alt="WHITE CAP" className="h-8 mb-4" />
              <div className="flex space-x-2 mb-4">
                <a href="#" className="text-white hover:text-yellow-500">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
                <a href="#" className="text-white hover:text-yellow-500">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772c-.5.509-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.247-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 1.802c-2.67 0-2.986.01-4.04.059-.976.045-1.505.207-1.858.344-.466.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.055-.059 1.37-.059 4.04 0 2.668.012 2.985.059 4.04.044.975.207 1.504.344 1.856.182.466.399.8.748 1.15.35.35.684.566 1.15.748.353.137.882.3 1.857.344 1.054.046 1.37.058 4.04.058 2.67 0 2.986-.012 4.04-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.352.3-.88.344-1.856.047-1.054.059-1.37.059-4.04 0-2.67-.012-2.986-.059-4.04-.044-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.054-.048-1.37-.06-4.04-.06zm0 3.063a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 8.468a3.333 3.333 0 100-6.666 3.333 3.333 0 000 6.666zm6.538-8.469a1.2 1.2 0 110-2.4 1.2 1.2 0 010 2.4z" />
                  </svg>
                </a>
                <a href="#" className="text-white hover:text-yellow-500">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.633 7.997c.013.175.013.349.013.523 0 5.325-4.053 11.461-11.46 11.461-2.282 0-4.402-.661-6.186-1.809.324.037.636.05.973.05a8.07 8.07 0 0 0 5.001-1.721 4.036 4.036 0 0 1-3.767-2.793c.249.037.499.062.761.062.361 0 .724-.05 1.061-.137a4.027 4.027 0 0 1-3.23-3.953v-.05c.537.299 1.16.486 1.82.511a4.022 4.022 0 0 1-1.796-3.354c0-.748.199-1.434.548-2.032a11.457 11.457 0 0 0 8.306 4.215c-.062-.3-.1-.611-.1-.923a4.026 4.026 0 0 1 4.028-4.028c1.16 0 2.207.486 2.943 1.272a7.957 7.957 0 0 0 2.556-.973 4.02 4.02 0 0 1-1.771 2.22 8.073 8.073 0 0 0 2.319-.624 8.645 8.645 0 0 1-2.019 2.083z" />
                  </svg>
                </a>
                <a href="#" className="text-white hover:text-yellow-500">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
              <div className="text-yellow-500 text-xl font-bold">
                1-800-944-8322
              </div>
              <div className="text-xs mt-2">
                <span className="flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                  Canadian Customers
                </span>
                <div className="mt-1">Visit WhiteCapSupply.com</div>
              </div>
            </div>
          </div>
          
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* OUR COMPANY */}
            <div>
              <h3 className="text-sm font-bold mb-4">OUR COMPANY</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">About White Cap</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Careers</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Investors</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Suppliers</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Contractor Field Notes</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Blog</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Former Associates</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Contact Us</a></li>
              </ul>
            </div>
            
            {/* HELP CENTER */}
            <div>
              <h3 className="text-sm font-bold mb-4">HELP CENTER</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Customer Assistance Form</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Invoices and Payments</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Branch Locations</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Request a Quote</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Order Status Notifications</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Create Business Account</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Contact a Specialist</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Return Policy</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">DOT Guidelines</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">SDS Publications</a></li>
              </ul>
            </div>
            
            {/* SERVICES */}
            <div>
              <h3 className="text-sm font-bold mb-4">SERVICES</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Contractor Services</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Apply for Credit</a></li>
              </ul>
              
              <h3 className="text-sm font-bold mt-6 mb-4">GOVERNMENT RESOURCES</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Federal</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">State & Local</a></li>
              </ul>
            </div>
            
            {/* CATALOGS */}
            <div>
              <h3 className="text-sm font-bold mb-4">CATALOGS</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Request a Catalog</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">E-Catalogs</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Contractor Trader® Promotions</a></li>
              </ul>
              
              <h3 className="text-sm font-bold mt-6 mb-4">HABLAMOS TU IDIOMA</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Financiación GreatAmerica</a></li>
              </ul>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="border-t border-gray-800 pt-6">
            <p className="text-gray-400 text-xs text-center mb-2">© Copyright 2025 White Cap Supply Holdings, LLC. All Rights Reserved.</p>
            <p className="text-gray-400 text-xs text-center">
              Use of this site is subject to the White Cap Supply Holdings, LLC. Legal 
              <a href="#" className="text-yellow-500 hover:underline">Terms</a>, 
              <a href="#" className="text-yellow-500 hover:underline">Terms of Sale</a>, 
              <a href="#" className="text-yellow-500 hover:underline">Rental Agreement Terms and Conditions</a>, 
              <a href="#" className="text-yellow-500 hover:underline">Privacy</a>, and 
              <a href="#" className="text-yellow-500 hover:underline">Accessibility Statement</a>.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CartPage;
