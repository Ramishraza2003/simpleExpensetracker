const STORAGE_KEY = "simple-expense-tracker";
const form = document.getElementById("expense-form");
const expenseList = document.getElementById("expense-list");
const totalValue = document.getElementById("total-value");
const entryCount = document.getElementById("entry-count");
const averageValue = document.getElementById("average-value");
const clearAllButton = document.getElementById("clear-all");
const dateInput = document.getElementById("date");
const chatForm = document.getElementById("chat-form");
const chatBox = document.getElementById("chat-box");
const apiKeyInput = document.getElementById("api-key");
const chatInput = document.getElementById("chat-input");

let expenses = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function saveExpenses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  render();
}

function render() {
  const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const count = expenses.length;
  const average = count ? total / count : 0;

  totalValue.textContent = formatCurrency(total);
  entryCount.textContent = count;
  averageValue.textContent = formatCurrency(average);

  if (!expenses.length) {
    expenseList.innerHTML = '<li class="expense-item">No expenses yet. Add your first one.</li>';
    return;
  }

  expenseList.innerHTML = expenses
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(
      (expense) => `
        <li class="expense-item">
          <div class="expense-meta">
            <strong>${expense.description}</strong>
            <span>${expense.category} • ${expense.date}</span>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <span class="expense-amount">${formatCurrency(Number(expense.amount))}</span>
            <button class="delete-btn" data-id="${expense.id}" type="button">Delete</button>
          </div>
        </li>
      `
    )
    .join("");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const payload = {
    id: Date.now(),
    description: document.getElementById("description").value.trim(),
    amount: document.getElementById("amount").value,
    category: document.getElementById("category").value,
    date: document.getElementById("date").value || new Date().toISOString().slice(0, 10),
  };

  if (!payload.description || !payload.amount) {
    return;
  }

  expenses.push(payload);
  form.reset();
  dateInput.value = new Date().toISOString().slice(0, 10);
  saveExpenses();
});

expenseList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;

  expenses = expenses.filter((item) => item.id !== Number(button.dataset.id));
  saveExpenses();
});

clearAllButton.addEventListener("click", () => {
  expenses = [];
  saveExpenses();
});

function addChatMessage(text, role) {
  const message = document.createElement("div");
  message.className = `message ${role}`;
  message.textContent = text;
  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const prompt = chatInput.value.trim();
  if (!prompt) return;

  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    addChatMessage("Please enter an OpenAI API key first.", "bot");
    return;
  }

  addChatMessage(prompt, "user");
  chatInput.value = "";
  addChatMessage("Thinking...", "bot");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a friendly budgeting coach. Give short practical advice for personal finance.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I could not generate a reply.";

    chatBox.lastElementChild.remove();
    addChatMessage(reply, "bot");
  } catch (error) {
    chatBox.lastElementChild.remove();
    addChatMessage("Sorry, the request failed. Check your API key and try again.", "bot");
  }
});

const savedApiKey = sessionStorage.getItem("expense-tracker-api-key");
if (savedApiKey) {
  apiKeyInput.value = savedApiKey;
}

apiKeyInput.addEventListener("change", () => {
  sessionStorage.setItem("expense-tracker-api-key", apiKeyInput.value.trim());
});

function init() {
  dateInput.value = new Date().toISOString().slice(0, 10);
  render();
  addChatMessage("Hi! I can help with budgeting tips and expense advice.", "bot");
}

init();
