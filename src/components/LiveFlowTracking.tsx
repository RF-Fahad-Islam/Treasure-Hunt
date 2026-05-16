import { motion } from "motion/react";
import { secondsToPenaltyPoints } from "@/lib/penalty";
import type { ArrivingTeam } from "@/services/spotLeader";
import type { DetailedTeam } from "@/services/flow";

interface LiveFlowTrackingProps {
  teams: (ArrivingTeam | DetailedTeam)[];
  currentSpotId?: string; // Optional: to highlight if the team is at the current leader's spot
  hideFutureSpots?: boolean; // Obfuscate future spot names as "???"
  onSpotClick?: (spotId: string, spotName: string) => void;
}

export function LiveFlowTracking({ teams, hideFutureSpots, onSpotClick }: LiveFlowTrackingProps) {
  return (
    <div className="flex flex-col gap-10">
      {teams.map((team, tIdx) => {
        const teamRoute = team.fullRoute;
        
        return (
          <motion.div 
            key={team.teamId} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: tIdx * 0.05 }}
            className="relative group"
          >
            <div className="mb-4 flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <motion.div 
                  whileHover={{ rotate: 10 }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-sm" 
                  style={{ background: team.huntCompleted ? "linear-gradient(135deg, #FFC800, #F59E0B)" : "linear-gradient(135deg, #1CB0F6, #007AFF)" }}
                >
                  {team.teamName.charAt(0)}
                </motion.div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[16px] font-black text-[#2B2B2B]">{team.teamName}</span>
                    {team.huntCompleted && <span className="text-[10px] font-black bg-[#FFC800] text-white px-1.5 py-0.5 rounded-md">🏆 FINISHED</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-[#58CC02] flex items-center gap-0.5">⭐ {Math.max(0, (team.totalPoints ?? 0) - secondsToPenaltyPoints(team.totalPenaltySeconds ?? 0))}</span>
                    <span className="text-[10px] font-black text-[#FF4B4B] flex items-center gap-0.5">⏱ -{secondsToPenaltyPoints(team.totalPenaltySeconds ?? 0)} pts</span>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#999] ml-1">({(team.totalPenaltySeconds / 60).toFixed(0)}m)</span>
                  </div>
                </div>
              </div>
                <div className="flex flex-col items-end">
                <span className="text-[15px] font-black text-[#58CC02]">
                  {teamRoute.filter(r => ['completed', 'revealed', 'solved'].includes(r.status || '')).length} / {teamRoute.length}
                </span>
                <span className="text-[9px] font-black uppercase tracking-tighter text-[#aaa]">Spots Cleared</span>
              </div>
            </div>


            {/* Flow Path */}
            <div className="relative flex items-center gap-0 overflow-x-auto pt-12 pb-6 scrollbar-hide">
              {/* Background track line */}
              <div className="absolute top-[76px] left-[40px] right-[40px] h-1.5 rounded-full bg-[#F0F0F0]" />
              
              {teamRoute.map((step, idx) => {
                const isCompleted = ['completed', 'revealed', 'solved'].includes(step.status || '');
                const isActive = step.isCurrent && !team.huntCompleted;
                const currentIdx = teamRoute.findIndex(r => r.isCurrent);
                const isPassed = !isActive && (isCompleted || (currentIdx >= 0 && idx < currentIdx)); 

                return (
                  <div key={idx} className="relative z-10 flex flex-col items-center min-w-[160px] first:pl-4 last:pr-4">
                    {/* Filled track line segment */}
                    {idx > 0 && (isPassed || (isActive && step.arrivalApproved)) && (
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        className="absolute top-[76px] -left-1/2 h-1.5" 
                        style={{ 
                          background: isPassed ? "#58CC02" : "#1CB0F6", 
                          zIndex: -1,
                          opacity: isPassed ? 1 : 0.4
                        }} 
                      />
                    )}

                    {/* Node Icon */}
                    <motion.div 
                      whileHover={{ scale: 1.1, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const revealed = isCompleted || isActive;
                        if (revealed && onSpotClick && step.spotId) {
                          onSpotClick(step.spotId, step.spotName);
                        }
                      }}
                      className={`relative w-14 h-14 rounded-2xl flex items-center justify-center border-[4px] transition-all duration-500 ${isActive ? 'scale-110 shadow-lg ring-4 ring-[#1CB0F620]' : ''} ${!hideFutureSpots || isCompleted || isActive ? 'cursor-pointer' : ''}`}
                      style={{ 
                        background: isCompleted ? "#58CC02" : isActive ? "#1CB0F6" : "#FFFFFF",
                        borderColor: isCompleted ? "#46A302" : isActive ? "#0f7ac0" : "#F0F0F0",
                        color: isCompleted || isActive ? "white" : "#CCC",
                      }}
                    >
                      <span className="text-[18px] font-black">
                        {isCompleted ? "🏆" : isActive ? "🎯" : hideFutureSpots ? "🔒" : (idx + 1)}
                      </span>
                                     {/* Base Points Badge (+100) */}
                      {((step.basePoints ?? 0) > 0 || (step.miniGamePoints ?? 0) > 0 || (step.penaltySeconds ?? 0) > 0) && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute bottom-full left-0 mb-1 flex flex-col gap-1 z-20"
                        >
                          {(step.basePoints ?? 0) > 0 && (
                            <div className="bg-white text-[#58CC02] text-[10px] font-black px-2 py-0.5 rounded-full shadow-md border-2 border-[#58CC02]/20">
                              +{(step.basePoints ?? 0)}
                            </div>
                          )}
                          {(step.miniGamePoints ?? 0) > 0 && (
                            <div className="bg-white text-[#FFC800] text-[10px] font-black px-2 py-0.5 rounded-full shadow-md border-2 border-[#FFC800]/20">
                              +{(step.miniGamePoints ?? 0)}
                            </div>
                          )}
                          {(step.penaltySeconds ?? 0) > 0 && (
                            <div className="bg-[#FF4B4B] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
                              -{((step.penaltySeconds ?? 0) / 60).toFixed(0)}m
                            </div>
                          )}
                        </motion.div>
                      )}
                    </motion.div>

                    {/* Spot details */}
                    <div className="mt-3 text-center px-2">
                      <p className={`text-[12px] font-black uppercase truncate max-w-[130px] ${isActive ? 'text-[#1CB0F6]' : isPassed ? 'text-[#58CC02]' : 'text-[#777]'}`}>
                        {hideFutureSpots && !isCompleted && !isActive ? "🔒 Locked" : step.spotName}
                      </p>
                      
                      {/* SUB MARKERS (The "Activities" Subtasks) */}
                      <div className="mt-4 flex justify-center gap-4">
                         {/* Arrival Marker */}
                         <div className="relative flex flex-col items-center gap-1.5 group/sub">
                           <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[14px] shadow-sm transition-all border-2 ${step.arrivalApproved ? 'bg-[#58CC02] border-[#46A302] text-white' : 'bg-white border-[#F0F0F0] text-[#CCC]'}`}>
                             {step.arrivalApproved ? '✅' : '📍'}
                           </div>
                           <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: step.arrivalApproved ? '#58CC02' : '#CCC' }}>
                             Arrival
                           </span>
                         </div>
  
                         {/* Mini-Game Marker */}
                         {step.hasMiniGame && (
                           <div className="relative flex flex-col items-center gap-1.5 group/sub">
                             <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[14px] shadow-sm transition-all border-2 ${step.miniGamePlayed ? 'bg-[#FFC800] border-[#EAB308] text-white' : 'bg-white border-[#F0F0F0] text-[#CCC]'}`}>
                               {step.miniGamePlayed ? '🎮' : '👾'}
                             </div>
                             <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: step.miniGamePlayed ? '#FFC800' : '#CCC' }}>
                               Game
                             </span>
                           </div>
                         )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

