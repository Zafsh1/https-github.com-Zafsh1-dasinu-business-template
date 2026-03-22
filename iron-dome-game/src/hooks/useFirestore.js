// ============================================================
// FIRESTORE HOOKS — Global Stats + User Score (PLG)
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import {
  getFirestore, doc, getDoc, setDoc, updateDoc,
  onSnapshot, increment, serverTimestamp,
} from 'firebase/firestore';
import { db, auth, PATHS, signInAnon } from '../firebase.js';

// ─── USE GLOBAL STATS ───────────────────────────────────
// Listens to /artifacts/{appId}/public/data/globalStats in realtime
export function useGlobalStats() {
  const [stats, setStats] = useState({
    totalInterceptions: 0,
    activePlayers: 0,
    topScore: 0,
    lastAttack: null,
    threatLevel: 1,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    const ref = doc(db, PATHS.globalStats);
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        setStats(prev => ({ ...prev, ...snap.data() }));
      }
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  return { stats, loading };
}

// ─── USE USER SCORE ─────────────────────────────────────
export function useUserScore() {
  const [userId, setUserId] = useState(null);
  const [bestScore, setBestScore] = useState(0);
  const [loading, setLoading] = useState(true);

  // Anonymous sign-in
  useEffect(() => {
    signInAnon().then(user => {
      if (user) setUserId(user.uid);
      setLoading(false);
    });
  }, []);

  // Load best score
  useEffect(() => {
    if (!userId || !db) return;
    getDoc(doc(db, PATHS.userScore(userId))).then(snap => {
      if (snap.exists()) setBestScore(snap.data().score || 0);
    });
  }, [userId]);

  // Submit score
  const submitScore = useCallback(async ({ score, levelId, interceptPct, savedCities }) => {
    if (!userId || !db) return;

    // Update best score if improved
    const isNew = score > bestScore;
    if (isNew) {
      setBestScore(score);
      await setDoc(doc(db, PATHS.userScore(userId)), {
        score,
        levelId,
        interceptPct,
        savedCities,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    // Increment global counter (PLG core mechanic)
    try {
      const globalRef = doc(db, PATHS.globalStats);
      await updateDoc(globalRef, {
        totalInterceptions: increment(interceptPct ? Math.floor(interceptPct) : 1),
        topScore: score > (await getDoc(globalRef)).data()?.topScore ? score : increment(0),
        lastAttack: serverTimestamp(),
      });
    } catch {
      // Global doc may not exist yet — create it
      try {
        await setDoc(doc(db, PATHS.globalStats), {
          totalInterceptions: interceptPct || 1,
          activePlayers: 1,
          topScore: score,
          lastAttack: serverTimestamp(),
          threatLevel: 1,
        }, { merge: true });
      } catch { /* offline */ }
    }

    return isNew;
  }, [userId, bestScore]);

  return { userId, bestScore, submitScore, loading };
}

// ─── USE THREAT LEVEL (PLG scaling) ─────────────────────
// As global interceptions grow, threat level increases
export function useThreatLevel() {
  const [threatLevel, setThreatLevel] = useState(1);

  useEffect(() => {
    if (!db) return;
    const ref = doc(db, PATHS.globalStats);
    const unsub = onSnapshot(ref, snap => {
      if (!snap.exists()) return;
      const total = snap.data().totalInterceptions || 0;
      // Scale: 0→1, 1000→2, 5000→3, 20000→4, 100000→5
      const lvl = total < 1000 ? 1 :
                  total < 5000 ? 2 :
                  total < 20000 ? 3 :
                  total < 100000 ? 4 : 5;
      setThreatLevel(lvl);
    });
    return unsub;
  }, []);

  return threatLevel;
}
