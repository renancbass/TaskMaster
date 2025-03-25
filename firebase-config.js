// firebase-config.js atualizado
const firebaseConfig = {
  apiKey: "AIzaSyDnFK90EvXNMTxgAyN3MwzEM3fAc-kPtKI",
  authDomain: "taskmasterrenan.firebaseapp.com",
  databaseURL: "https://taskmasterrenan-default-rtdb.firebaseio.com",
  projectId: "taskmasterrenan",
  storageBucket: "taskmasterrenan.appspot.com",
  messagingSenderId: "853892676669",
  appId: "G-X7EKX8Z6VH"
};

// Inicialização
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const tasksRef = db.ref('taskmaster');

// Teste simplificado de conexão
tasksRef.child('connectionTest').set({
  timestamp: firebase.database.ServerValue.TIMESTAMP
})
.then(() => console.log("Firebase conectado com sucesso!"))
.catch(error => console.error("Erro de conexão:", error));

// Exportação (se usando módulos)
export { db, tasksRef };
