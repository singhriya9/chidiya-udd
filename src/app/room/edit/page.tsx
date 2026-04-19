'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { RoomLobby } from '@/components/lobby/RoomLobby';
import { GameTable, WinnerScreen } from '@/components/game/GameTable';
import { StateSwitcher } from '@/components/game-preview/StateSwitcher';
import { roomPreviewStates } from '@/components/game-preview/fixtures';
import { Button } from '@/components/ui/button';

export default function RoomEditPage() {
  const [activeStateId, setActiveStateId] = useState('activeRound');

  const selectedState = useMemo(
    () =>
      roomPreviewStates.find((state) => state.id === activeStateId) ?? roomPreviewStates[0],
    [activeStateId],
  );
  const myPreviewCorrectGuesses = useMemo(
    () =>
      selectedState?.players.find((player) => player.id === selectedState.myId)?.score,
    [selectedState],
  );

  if (!selectedState) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0e1a]">
      <div className="px-4 pt-4 sm:px-6">
        <StateSwitcher
          title="Room Edit States"
          options={roomPreviewStates.map((state) => ({
            id: state.id,
            label: state.label,
          }))}
          activeId={selectedState.id}
          onChange={setActiveStateId}
        />
      </div>

      <div className="flex items-center px-4 pt-4 absolute top-20 left-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-white hover:bg-white/10 rounded-xl h-12! w-12! [&_svg]:size-7!"
          title="Preview back button"
        >
          <ArrowLeft className="size-7!" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-white hover:bg-white/10 rounded-xl h-12! w-12! [&_svg]:size-7!"
          title={selectedState.audioEnabled ? 'Mute' : 'Unmute'}
        >
          {selectedState.audioEnabled ? (
            <Volume2 className="size-7!" />
          ) : (
            <VolumeX className="size-7!" />
          )}
        </Button>
        <span className="text-slate-500 text-sm ml-1 font-mono tracking-widest">
          {selectedState.roomId.toUpperCase()}
        </span>
      </div>

      {selectedState.connectionStatus !== 'open' && (
        <div className="absolute top-23 left-1/2 -translate-x-1/2 z-20 rounded-full px-3 py-1 text-xs font-semibold bg-white/10 border border-white/15 text-slate-200">
          {selectedState.connectionStatus === 'connecting'
            ? 'Connecting...'
            : 'Reconnecting...'}
        </div>
      )}

      {selectedState.winner && (
        <WinnerScreen
          winnerName={selectedState.winner.name}
          winnerAvatar={selectedState.winner.avatar}
          myCorrectGuesses={myPreviewCorrectGuesses}
          totalRounds={selectedState.round}
          onPlayAgain={() => {}}
          onLeaderboard={() => {}}
        />
      )}

      <div className="pt-10">
        {!selectedState.gameStarted ? (
          <RoomLobby
            roomId={selectedState.roomId}
            players={selectedState.players}
            myId={selectedState.myId}
            onStartGame={() => {}}
            onEnableAudio={() => {}}
            audioEnabled={selectedState.audioEnabled}
          />
        ) : (
          <div className="flex-1">
            <GameTable
              players={selectedState.players}
              myId={selectedState.myId}
              currentItem={selectedState.currentItem}
              timerMs={selectedState.timerMs}
              round={selectedState.round}
              roundActive={selectedState.roundActive}
              shakeTrigger={selectedState.shakeTrigger}
              clickingPlayers={new Set(selectedState.clickingPlayerIds)}
              spectatorReactions={selectedState.spectatorReactions}
              onUdd={() => {}}
              onSpectatorReaction={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
}
