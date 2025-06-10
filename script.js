const API_BASE = "https://math-quiz.fly.dev";
let authToken = localStorage.getItem("token") || null;
let currentUser = null;
let questions = [];
let currentQuestionIndex = 0;
let score = 0;

async function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  
  try {
    const response = await fetch(`${API_BASE}/api/collections/users/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, passwordConfirm: password })
    });
    
    if (response.status === 200) {
      await login();
    } else {
      const errorData = await response.json();
      alert(`Signup failed: ${errorData.message}`);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  
  try {
    const response = await fetch(`${API_BASE}/api/collections/users/auth-with-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity: email, password })
    });
    
    const data = await response.json();
    if (data.token) {
      authToken = data.token;
      currentUser = data.record;
      localStorage.setItem("token", data.token);
      showUser(email);
      generateQuestions();
    } else {
      alert("Login failed. Please check your credentials.");
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

function logout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem("token");
  document.getElementById("auth-container").style.display = "block";
  document.getElementById("user-info").style.display = "none";
  document.getElementById("quiz-container").style.display = "none";
  document.getElementById("scoreboard").style.display = "none";
}

function showUser(email) {
  document.getElementById("auth-container").style.display = "none";
  document.getElementById("user-info").style.display = "block";
  document.getElementById("quiz-container").style.display = "block";
  document.getElementById("scoreboard").style.display = "block";
  document.getElementById("user-email").textContent = email;
  loadScores();
}

function generateQuestions() {
  questions = [
    { question: "1.2 × 0.5 = ?", answer: 0.6 },
    { question: "12 ÷ 3 = ?", answer: 4 },
    { question: "5.5 + 3.5 = ?", answer: 9 },
    { question: "8 - 3.2 = ?", answer: 4.8 },
    { question: "2.5 × 4 = ?", answer: 10 }
  ];
  
  currentQuestionIndex = 0;
  score = 0;
  showQuestion();
}

function showQuestion() {
  if (currentQuestionIndex < questions.length) {
    const q = questions[currentQuestionIndex];
    document.getElementById("question").textContent = q.question;
    document.getElementById("answer").value = "";
    document.getElementById("result").textContent = "";
    document.getElementById("current-score").textContent = score;
    document.getElementById("total-questions").textContent = questions.length;
  } else {
    endQuiz();
  }
}

function checkAnswer() {
  const userAnswer = parseFloat(document.getElementById("answer").value);
  const correctAnswer = questions[currentQuestionIndex].answer;
  
  if (Math.abs(userAnswer - correctAnswer) < 0.01) {
    document.getElementById("result").textContent = "Correct!";
    document.getElementById("result").style.color = "green";
    score++;
  } else {
    document.getElementById("result").textContent = `Wrong! Correct answer: ${correctAnswer}`;
    document.getElementById("result").style.color = "red";
  }
  
  document.getElementById("current-score").textContent = score;
  currentQuestionIndex++;
  setTimeout(showQuestion, 1500);
}

async function endQuiz() {
  const finalScore = Math.round((score / questions.length) * 100);
  alert(`Quiz completed! Your score: ${finalScore}%`);
  
  if (authToken) {
    try {
      await fetch(`${API_BASE}/api/collections/scores/records`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          user: currentUser.id,
          topic: "Math Quiz",
          score: finalScore
        })
      });
      loadScores();
    } catch (error) {
      console.error("Failed to save score:", error);
    }
  }
  
  generateQuestions();
}

async function loadScores() {
  if (!authToken) return;
  
  try {
    const response = await fetch(`${API_BASE}/api/collections/scores/records?sort=-created&filter=(user='${currentUser.id}')`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    const list = document.getElementById("score-list");
    list.innerHTML = "";
    
    data.items.forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.topic}: ${item.score}% (${new Date(item.created).toLocaleDateString()})`;
      list.appendChild(li);
    });
  } catch (error) {
    console.error("Failed to load scores:", error);
  }
}

// Initialize app
if (authToken) {
  // Validate token and load user
  (async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users/refresh`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const data = await response.json();
      if (data.token) {
        authToken = data.token;
        currentUser = data.record;
        localStorage.setItem("token", data.token);
        showUser(data.record.email);
        generateQuestions();
      }
    } catch {
      logout();
    }
  })();
}

// Service Worker registration
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("Service Worker registered"))
    .catch(e => console.error("SW registration failed:", e));
}
