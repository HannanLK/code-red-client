"use client";
import { motion } from "framer-motion";
import Header from "@/components/common/Header";
import Board from "@/components/game/Board";
import Rack from "@/components/game/Rack";
import ScoreBoard from "@/components/game/ScoreBoard";
import Timer from "@/components/game/Timer";
import Lobby from "@/components/lobby";
import AuthPanel from "@/components/auth";
import LoginGate from "@/components/auth/LoginGate";

export default function Home() {
  return (
    <div className="min-h-screen p-6 sm:p-10">
      <LoginGate />
      <Header />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-4"
      >
        <div className="lg:col-span-3 space-y-4">
          <Board />
          <Rack />
        </div>
        <div className="lg:col-span-1 space-y-4">
          <Timer seconds={120} />
          <ScoreBoard />
          <Lobby />
          <AuthPanel />
        </div>
      </motion.div>
    </div>
  );
}
