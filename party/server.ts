import type * as Party from "partykit/server";
import pack1 from "./pack1.json";
import pack2 from "./pack2.json";
import pack3 from "./pack3.json";
import pack4 from "./pack4.json";
import pack5 from "./pack5.json";
import pack6 from "./pack6.json";

interface Player {
  id: string;
  name: string;
  avatar: string;
  lives: number;
  score: number;
  active: boolean;
}

interface GameItem {
  id: string;
  english: string;
  hindi: string;
  flies: boolean;
}

interface PackDefinition {
  id: string;
  items: GameItem[];
}

const itemPacks: PackDefinition[] = [
  { id: "pack1", items: pack1 },
  { id: "pack2", items: pack2 },
  { id: "pack3", items: pack3 },
  { id: "pack4", items: pack4 },
  { id: "pack5", items: pack5 },
  { id: "pack6", items: pack6 },
];

const DISCONNECT_GRACE_MS = 15000;

export default class ChidiyaUddServer implements Party.Server {
  players: Map<string, Player> = new Map();
  connectionToPlayerKey: Map<string, string> = new Map();
  disconnectTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  gameActive = false;
  currentItem: GameItem | null = null;
  currentPack: PackDefinition | null = null;
  roundResponses: Map<string, { clicked: boolean; timestamp: number }> =
    new Map();
  currentTimer: ReturnType<typeof setTimeout> | null = null;
  nextRoundTimer: ReturnType<typeof setTimeout> | null = null;
  roundEndsAt: number | null = null;
  roundTimer = 3000;
  roundNumber = 0;

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    console.log(
      `[Connect] Client connected with id: ${conn.id}. Total players: ${this.players.size}`,
    );
    this.connectionToPlayerKey.delete(conn.id);
    conn.send(JSON.stringify({ type: "CONNECTED", id: conn.id }));
    conn.send(
      JSON.stringify({
        type: "LOBBY_UPDATE",
        players: [...this.players.values()],
      }),
    );
    conn.send(
      JSON.stringify({
        type: "PLAYER_JOINED",
        players: [...this.players.values()],
      }),
    );
  }

  onClose(conn: Party.Connection) {
    const playerKey = this.connectionToPlayerKey.get(conn.id);
    this.connectionToPlayerKey.delete(conn.id);

    console.log(
      `[Close] Client disconnected with id: ${conn.id}. Player key: ${playerKey ?? "none"}. Game active: ${this.gameActive}`,
    );
    if (!playerKey) return;
    if (this.hasActiveConnection(playerKey)) return;

    const existingTimer = this.disconnectTimers.get(playerKey);
    if (existingTimer) clearTimeout(existingTimer);

    const timeout = setTimeout(() => {
      if (this.hasActiveConnection(playerKey)) {
        this.disconnectTimers.delete(playerKey);
        return;
      }

      const removed = this.players.delete(playerKey);
      this.roundResponses.delete(playerKey);
      this.disconnectTimers.delete(playerKey);

      if (!removed) return;
      this.broadcastLobbyUpdate();

      if (this.gameActive) {
        const remaining = [...this.players.values()].filter((p) => p.active);
        if (remaining.length <= 1) {
          this.endGame(remaining[0]);
        }
      }
    }, DISCONNECT_GRACE_MS);

    this.disconnectTimers.set(playerKey, timeout);
  }

  onMessage(message: string, sender: Party.Connection) {
    console.log(`[Message] From ${sender.id}: ${message}`);
    let data: any;
    try {
      data = JSON.parse(message);
    } catch {
      return;
    }

    switch (data.type) {
      case "REQUEST_SOLO_PACK": {
        const soloPack = this.selectRandomPack();
        sender.send(
          JSON.stringify({
            type: "SOLO_PACK",
            packId: soloPack.id,
            items: soloPack.items,
          }),
        );
        break;
      }

      case "JOIN":
        this.handleJoin(sender, data);
        break;

      case "START_GAME":
        if (!this.gameActive && this.players.size >= 1) {
          this.gameActive = true;
          this.roundTimer = 3000;
          this.roundNumber = 0;
          this.currentPack = this.selectRandomPack();
          this.room.broadcast(
            JSON.stringify({
              type: "GAME_STARTED",
              packId: this.currentPack.id,
            }),
          );
          setTimeout(() => this.newRound(), 1000);
        }
        break;

      case "UDD_CLICKED":
        if (this.gameActive && this.currentItem) {
          const playerKey = this.connectionToPlayerKey.get(sender.id);
          if (playerKey) {
            this.handleUddClick(playerKey);
          }
        }
        break;

      case "SPECTATOR_REACTION":
        {
          const playerKey = this.connectionToPlayerKey.get(sender.id) ?? sender.id;
        // Broadcast reaction from eliminated player to everyone
          this.room.broadcast(
            JSON.stringify({
              type: "SPECTATOR_REACTION",
              playerId: playerKey,
              reaction: data.reaction,
            }),
          );
        }
        break;

      case "PLAY_AGAIN":
        this.resetGame();
        break;
    }
  }

  newRound() {
    if (!this.gameActive) return;
    if (this.currentTimer) clearTimeout(this.currentTimer);
    this.currentTimer = null;

    this.roundNumber += 1;
    console.log(
      `[New Round] Round ${this.roundNumber} starting. Timer: ${this.roundTimer}ms`,
    );

    const itemPool = this.currentPack?.items ?? itemPacks[0].items;
    const item =
      this.roundNumber === 1
        ? itemPool[0]
        : (itemPool.slice(1)[
            Math.floor(Math.random() * Math.max(1, itemPool.length - 1))
          ] ?? itemPool[0]);

    this.currentItem = item;
    this.roundResponses = new Map();

    this.room.broadcast(
      JSON.stringify({
        type: "NEW_ITEM",
        packId: this.currentPack?.id ?? itemPacks[0].id,
        item,
        timerMs: this.roundTimer,
        round: this.roundNumber,
      }),
    );

    this.roundEndsAt = Date.now() + this.roundTimer;
    this.currentTimer = setTimeout(() => this.evaluateRound(), this.roundTimer);
  }

  handleUddClick(playerId: string) {
    if (!this.currentItem || this.roundResponses.has(playerId)) return;

    const player = this.players.get(playerId);
    if (!player || !player.active) return;

    this.roundResponses.set(playerId, { clicked: true, timestamp: Date.now() });

    this.room.broadcast(
      JSON.stringify({
        type: "PLAYER_ACTION",
        playerId,
      }),
    );

    // Immediate wrong penalty: clicked a non-flying item
    if (!this.currentItem.flies) {
      player.lives -= 1;
      this.room.broadcast(
        JSON.stringify({
          type: "LIVES_UPDATE",
          playerId: player.id,
          lives: player.lives,
        }),
      );
      if (player.lives <= 0) {
        player.active = false;
        this.room.broadcast(
          JSON.stringify({ type: "PLAYER_OUT", playerId: player.id }),
        );

        const remaining = [...this.players.values()].filter((p) => p.active);
        if (remaining.length <= 1) {
          if (this.currentTimer) clearTimeout(this.currentTimer);
          this.endGame(remaining[0]);
        }
      }
    }
  }

  evaluateRound() {
    if (!this.currentItem || !this.gameActive) return;
    if (this.currentTimer) {
      clearTimeout(this.currentTimer);
      this.currentTimer = null;
    }
    this.roundEndsAt = null;

    console.log(
      `[Evaluate Round] Evaluating round ${this.roundNumber} for item: ${this.currentItem.english} (flies: ${this.currentItem.flies})`,
    );

    const activePlayers = [...this.players.values()].filter((p) => p.active);

    for (const player of activePlayers) {
      const response = this.roundResponses.get(player.id);
      const clicked = !!response?.clicked;
      const shouldClick = this.currentItem.flies;

      // missed flying item → lose life
      if (!clicked && shouldClick) {
        player.lives -= 1;
        this.room.broadcast(
          JSON.stringify({
            type: "LIVES_UPDATE",
            playerId: player.id,
            lives: player.lives,
          }),
        );
        if (player.lives <= 0) {
          player.active = false;
          this.room.broadcast(
            JSON.stringify({ type: "PLAYER_OUT", playerId: player.id }),
          );
        }
      } else if (clicked && shouldClick) {
        // Correct click
        player.score += 1;
      } else if (!clicked && !shouldClick) {
        // Correct no-click (player intentionally did not press UDD)
        player.score += 1;
      }
    }

    const remaining = [...this.players.values()].filter((p) => p.active);
    if (remaining.length <= 1) {
      this.endGame(remaining[0]);
      return;
    }

    // Speed up slightly each round (min 1000ms)
    this.roundTimer = Math.max(1000, this.roundTimer - 50);

    // Next round after 1200ms pause
    if (this.nextRoundTimer) clearTimeout(this.nextRoundTimer);
    this.nextRoundTimer = setTimeout(() => this.newRound(), 1200);
  }

  endGame(winner: Player | undefined) {
    console.log(`[End Game] Game over. Winner: ${winner?.name ?? "Nobody"}`);
    this.gameActive = false;
    this.clearRoundTimers();
    this.room.broadcast(
      JSON.stringify({
        type: "GAME_OVER",
        winnerId: winner?.id ?? null,
        winnerName: winner?.name ?? "Nobody",
        winnerAvatar: winner?.avatar ?? null,
        scores: [...this.players.values()].map((p) => ({
          id: p.id,
          name: p.name,
          score: p.score,
        })),
      }),
    );
  }

  broadcastLobbyUpdate() {
    const players = [...this.players.values()];
    this.room.broadcast(
      JSON.stringify({
        type: "LOBBY_UPDATE",
        players,
      }),
    );
    this.room.broadcast(
      JSON.stringify({
        type: "PLAYER_JOINED",
        players,
      }),
    );
  }

  resetGame() {
    console.log(`[Reset Game] Game reset requested.`);
    this.clearRoundTimers();
    this.players.forEach((p) => {
      p.lives = 3;
      p.score = 0;
      p.active = true;
    });
    this.gameActive = false;
    this.roundTimer = 3000;
    this.roundNumber = 0;
    this.currentItem = null;
    this.currentPack = null;
    this.roundResponses = new Map();

    this.room.broadcast(JSON.stringify({ type: "ROOM_RESET" }));
    this.broadcastLobbyUpdate();
  }

  selectRandomPack() {
    return (
      itemPacks[Math.floor(Math.random() * itemPacks.length)] ?? itemPacks[0]
    );
  }

  handleJoin(sender: Party.Connection, data: any) {
    const incomingKey =
      typeof data.playerKey === "string" && data.playerKey.trim().length > 0
        ? data.playerKey.trim()
        : sender.id;
    const name =
      typeof data.name === "string" && data.name.trim().length > 0
        ? data.name.trim()
        : "Player";
    const avatar =
      typeof data.avatar === "string" && data.avatar.trim().length > 0
        ? data.avatar.trim()
        : sender.id;

    const pendingTimer = this.disconnectTimers.get(incomingKey);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      this.disconnectTimers.delete(incomingKey);
    }

    this.connectionToPlayerKey.set(sender.id, incomingKey);

    const existing = this.players.get(incomingKey);
    if (existing) {
      existing.name = name;
      existing.avatar = avatar;
      existing.id = incomingKey;
    } else {
      this.players.set(incomingKey, {
        id: incomingKey,
        name,
        avatar,
        lives: 3,
        score: 0,
        active: true,
      });
    }

    sender.send(JSON.stringify({ type: "CONNECTED", id: incomingKey }));
    this.broadcastLobbyUpdate();
    this.sendRoomSnapshot(sender, incomingKey);
  }

  sendRoomSnapshot(conn: Party.Connection, playerKey: string) {
    const timerMs = this.getRemainingTimerMs();
    conn.send(
      JSON.stringify({
        type: "ROOM_SNAPSHOT",
        myId: playerKey,
        players: [...this.players.values()],
        gameActive: this.gameActive,
        round: this.roundNumber,
        timerMs,
        packId: this.currentPack?.id ?? null,
        item: this.currentItem,
      }),
    );

    if (!this.gameActive || !this.currentPack) return;

    conn.send(
      JSON.stringify({
        type: "GAME_STARTED",
        packId: this.currentPack.id,
      }),
    );
    if (this.currentItem) {
      conn.send(
        JSON.stringify({
          type: "NEW_ITEM",
          packId: this.currentPack.id,
          item: this.currentItem,
          timerMs,
          round: this.roundNumber,
        }),
      );
    }
  }

  getRemainingTimerMs() {
    if (!this.roundEndsAt) return this.roundTimer;
    return Math.max(300, this.roundEndsAt - Date.now());
  }

  hasActiveConnection(playerKey: string) {
    for (const mappedKey of this.connectionToPlayerKey.values()) {
      if (mappedKey === playerKey) return true;
    }
    return false;
  }

  clearRoundTimers() {
    if (this.currentTimer) clearTimeout(this.currentTimer);
    if (this.nextRoundTimer) clearTimeout(this.nextRoundTimer);
    this.currentTimer = null;
    this.nextRoundTimer = null;
    this.roundEndsAt = null;
  }
}
