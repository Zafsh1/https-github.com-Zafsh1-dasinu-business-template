# 🛡️ מגן ברזל — Iron Shield Defense Network

משחק הגנה אווירית רב-שכבתי מבוסס אירועי חרבות ברזל.

## הפעלה מהירה

```bash
cd iron-dome-game
npm install
npm run dev
```

## Firebase Setup (PLG)

1. צור פרויקט ב-[Firebase Console](https://console.firebase.google.com)
2. הפעל **Firestore** ו-**Anonymous Authentication**
3. העתק `.env.example` ל-`.env` ומלא את הפרטים
4. הגדר Firestore Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/public/data/{doc} {
      allow read: if true;
      allow write: if true; // tighten in production
    }
    match /artifacts/{appId}/users/{userId}/{doc=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## ארכיטקטורה

```
src/
├── game/
│   ├── constants.js   # THREAT_TYPES, INTERCEPTORS, CITIES, LEVELS
│   └── engine.js      # GameEngine — physics loop, spawn, collisions
├── components/
│   ├── GameCanvas.jsx # Canvas renderer
│   ├── HUD.jsx        # Heads-Up Display
│   ├── Menu.jsx       # Main menu + PLG counter
│   └── Certificate.jsx # Shareable end certificate
├── hooks/
│   ├── useFirestore.js # Firestore hooks (global stats + user score)
│   └── useAudio.js     # Web Audio API (no files needed)
├── firebase.js        # Firebase init + Firestore paths
└── App.jsx            # Game state machine
```

## מערכות הגנה

| מערכת | עלות | טווח | מתאים ל |
|-------|------|------|---------|
| כיפת ברזל | $50 | קצר | רקטות, כטב"מים |
| קלע דוד | $150 | בינוני | כולם |
| חץ 3 | $500 | ארוך | בליסטים בלבד |

## Firestore Paths

- Global Stats: `/artifacts/{appId}/public/data/globalStats`
- User Score: `/artifacts/{appId}/users/{userId}/scores/best`
