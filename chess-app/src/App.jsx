import React, { useState, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { supabase } from "./supabase"; 

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [game, setGame] = useState(new Chess());
  const [aiAdvice, setAiAdvice] = useState("Сделай ход, и я проанализирую твою стратегию...");

  const [roomId, setRoomId] = useState(null);
  const [channel, setChannel] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return; 

    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");

    if (room) {
      setRoomId(room);
      const newChannel = supabase.channel(`game-${room}`);

      newChannel
        .on("broadcast", { event: "move" }, (payload) => {
          const newGame = new Chess(payload.fen);
          setGame(newGame);
          setAiAdvice("Оппонент сделал ход!");
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setAiAdvice("Подключено к комнате! Ждем ходов.");
          }
        });

      setChannel(newChannel);
      return () => { supabase.removeChannel(newChannel); };
    }
  }, [session]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) alert("Ошибка регистрации: " + error.message);
    else alert("Успешно! Теперь нажми Войти.");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Ошибка входа: " + error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const createRoom = () => {
    const newRoom = Math.random().toString(36).substring(2, 8);
    window.history.pushState({}, '', `?room=${newRoom}`);
    window.location.reload(); 
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Ссылка скопирована! Отправь её оппоненту.");
  };

  function safeGameMutate(modify) {
    setGame((g) => {
      const update = new Chess(g.fen());
      modify(update);
      return update;
    });
  }

  function onDrop(sourceSquare, targetSquare) {
    let move = null;
    let currentFen = null;

    safeGameMutate((gameCopy) => {
      try { 
        move = gameCopy.move({ from: sourceSquare, to: targetSquare, promotion: "q" }); 
        currentFen = gameCopy.fen();
      } 
      catch (e) { move = null; }
    });

    if (move === null) return false;

    if (channel && currentFen) {
      channel.send({
        type: "broadcast",
        event: "move",
        fen: currentFen,
      });
    }

    if (game.history().length > 2) {
      setAiAdvice("Хм, в BigTech интервью за такой ход спросили бы: 'А как это масштабируется?'");
    } else {
      setAiAdvice("Хорошее начало. Контроль центра — залог успеха.");
    }
    return true;
  }

  if (!session) {
    return (
      <div style={{...styles.container, justifyContent: 'center', alignItems: 'center'}}>
        <div style={styles.loginCard}>
          <h2 style={{ color: '#f39c12', marginBottom: '20px' }}>ChessFlow AI ♟️</h2>
          <p style={{ color: '#aaa', marginBottom: '30px' }}>Создай аккаунт, чтобы сохранять прогресс.</p>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              type="email" 
              placeholder="Твой email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
            <input 
              type="password" 
              placeholder="Пароль (минимум 6 символов)" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={handleSignUp} style={{...styles.proButton, flex: 1, backgroundColor: '#333'}}>Регистрация</button>
              <button onClick={handleLogin} style={{...styles.proButton, flex: 1}}>Войти</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h2 style={{ color: '#f39c12' }}>ChessFlow AI</h2>
          <span style={styles.badge}>Beta</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={styles.resetButton} onClick={handleLogout}>Выйти</button>
          <button style={styles.proButton} onClick={() => alert("Оплата Stripe временно в режиме песочницы")}>
            Upgrade to Pro ✨
          </button>
        </div>
      </header>

      <div style={styles.mainLayout}>
        <aside style={styles.sidebar}>
          <div style={styles.section}>
            <h3>AI Coach 🤖</h3>
            <div style={styles.aiCard}>
              <p style={styles.aiText}>{aiAdvice}</p>
            </div>
          </div>

          <div style={styles.statusBadge}>
            {game.isCheckmate() ? "Мат!" : game.turn() === "w" ? "Ход белых" : "Ход черных"}
          </div>

          <div style={styles.section}>
            <h4>Топ игроков (Алматы) 🇰🇿</h4>
            <div style={styles.leaderboard}>
              <div style={styles.leaderRow}><span>1. chess_boss</span> <span>2800</span></div>
              <div style={styles.leaderRow}><span>2. react_dev</span> <span>2450</span></div>
              <div style={styles.leaderRow}><span style={{color: '#f39c12'}}>3. {session.user.email.split('@')[0]}</span> <span>1200</span></div>
            </div>
          </div>

          <div style={styles.section}>
            <h4>Мультиплеер 🌐</h4>
            {roomId ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '13px', color: '#aaa' }}>Комната: {roomId}</span>
                <button style={{...styles.proButton, backgroundColor: '#2980b9'}} onClick={copyLink}>
                  Скопировать ссылку
                </button>
              </div>
            ) : (
              <button style={styles.proButton} onClick={createRoom}>
                Создать комнату
              </button>
            )}
          </div>

          <button style={styles.resetButton} onClick={() => { setGame(new Chess()); setAiAdvice("Новая партия — новые возможности!"); }}>
            Сбросить игру
          </button>
        </aside>

        <main style={styles.boardContainer}>
          <div style={{ marginBottom: '10px', color: '#aaa', fontSize: '14px' }}>
             📍 Режим: <b>Подготовка к BigTech Interview</b>
          </div>
          <div style={{ width: "100%", maxWidth: "550px", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
            <Chessboard 
              position={game.fen()} 
              onPieceDrop={onDrop} 
              animationDuration={200}
              customDarkSquareStyle={{ backgroundColor: "#779556" }}
              customLightSquareStyle={{ backgroundColor: "#ebecd0" }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#121212", color: "#fff", fontFamily: "sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 40px", backgroundColor: "#1e1e1e", borderBottom: "1px solid #333" },
  badge: { backgroundColor: '#333', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: '#888' },
  proButton: { backgroundColor: "#f39c12", border: "none", padding: "8px 20px", borderRadius: "20px", color: "white", fontWeight: "bold", cursor: "pointer" },
  mainLayout: { display: "flex", flex: 1, padding: "20px", gap: "20px" },
  sidebar: { width: "280px", backgroundColor: "#1e1e1e", padding: "20px", borderRadius: "12px", display: 'flex', flexDirection: 'column' },
  section: { marginBottom: '25px' },
  aiCard: { backgroundColor: "#2c3e50", padding: "15px", borderRadius: "8px", borderLeft: "4px solid #f39c12" },
  aiText: { margin: 0, fontSize: "14px", lineHeight: "1.4", fontStyle: "italic" },
  statusBadge: { padding: "10px", backgroundColor: "#27ae60", borderRadius: "4px", textAlign: "center", marginBottom: "20px", fontWeight: 'bold' },
  leaderboard: { backgroundColor: '#161616', borderRadius: '8px', padding: '10px' },
  leaderRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '5px 0', borderBottom: '1px solid #222' },
  resetButton: { width: "100%", padding: "12px", cursor: "pointer", backgroundColor: 'transparent', border: '1px solid #444', color: '#888', borderRadius: '6px', marginTop: 'auto' },
  boardContainer: { flex: 1, display: "flex", flexDirection: 'column', alignItems: "center" },
  loginCard: { backgroundColor: "#1e1e1e", padding: "40px", borderRadius: "12px", textAlign: "center", width: "100%", maxWidth: "400px", border: "1px solid #333" },
  input: { padding: "12px", borderRadius: "8px", border: "1px solid #444", backgroundColor: "#121212", color: "#fff", outline: "none", fontSize: "16px" }
};