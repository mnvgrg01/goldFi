"use client";

import { usePrivy } from "@privy-io/react-auth";
import { LoginButton } from "@/components/auth/LoginButton";
import { WalletInfo } from "@/components/dashboard/WalletInfo";
import { PositionCard } from "@/components/dashboard/PositionCard";
import { TransactionHistory } from "@/components/dashboard/TransactionHistory";
import { DepositForm } from "@/components/actions/DepositForm";
import { SwapForm } from "@/components/actions/SwapForm";
import { BorrowForm } from "@/components/actions/BorrowForm";
import { ManagePosition } from "@/components/actions/ManagePosition";
import { Shield, Zap, Lock, ChevronRight } from "lucide-react";

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">GoldFi</span>
          </div>
          <LoginButton />
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full text-amber-700 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Gasless transactions powered by Biconomy
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Borrow against your
            <span className="text-amber-500"> gold</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Deposit USDT, swap to XAUT0, and borrow USDT against your gold collateral. 
            No gas fees. No ETH required. Just email login.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <LoginButton />
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:border-gray-300 transition-colors"
            >
              How it works
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Gasless Transactions</h3>
              <p className="text-gray-600">
                No ETH required. All transactions are sponsored by our paymaster.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Collateral</h3>
              <p className="text-gray-600">
                Your gold-backed tokens are secured by Morpho's audited smart contracts.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Login</h3>
              <p className="text-gray-600">
                No seed phrases. Sign up with just your email and start borrowing in minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          <div className="space-y-8">
            {[
              {
                step: "1",
                title: "Sign up with email",
                description: "Create an account with just your email. A smart wallet is automatically created for you.",
              },
              {
                step: "2",
                title: "Deposit USDT",
                description: "Send USDT on Arbitrum to your smart wallet address. No gas fees required.",
              },
              {
                step: "3",
                title: "Swap to XAUT0",
                description: "Convert your USDT to gold-backed XAUT0 tokens via CoW Swap.",
              },
              {
                step: "4",
                title: "Borrow USDT",
                description: "Use your XAUT0 as collateral to borrow USDT at competitive rates.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          <p>Powered by Privy, Biconomy, CoW Swap, and Morpho</p>
        </div>
      </footer>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">GoldFi</span>
          </div>
          <LoginButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Dashboard */}
          <div className="lg:col-span-2 space-y-6">
            <WalletInfo />
            <PositionCard />
            <TransactionHistory />
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            <DepositForm />
            <SwapForm />
            <BorrowForm />
            <ManagePosition />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  const { authenticated, ready } = usePrivy();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-amber-200 rounded-lg"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return authenticated ? <Dashboard /> : <LandingPage />;
}
