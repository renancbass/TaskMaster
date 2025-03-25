// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDnFK90EvXNMTxgAyN3MwzEM3fAc-kPtKI",
  authDomain: "taskmasterrenan.firebaseapp.com",
  databaseURL: "https://taskmasterrenan-default-rtdb.firebaseio.com",
  projectId: "taskmasterrenan",
  storageBucket: "taskmasterrenan.appspot.com",
  messagingSenderId: "853892676669",
  appId: "G-X7EKX8Z6VH"
};

// Inicializar o Firebase
firebase.initializeApp(firebaseConfig);

// Testar conexão
const testRef = firebase.database().ref('test');
testRef.set({
  message: "Conexão com Firebase funcionando!",
  timestamp: Date.now()
}).then(() => {
  console.log("Conexão com Firebase estabelecida com sucesso!");
}).catch(error => {
  console.error("Erro ao conectar com Firebase:", error);
});

// Exportar referência ao banco de dados
const db = firebase.database();
const tasksRef = db.ref('taskmaster');
