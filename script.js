// LifeOS: Personal productivity dashboard

const $ = (id) => document.getElementById(id);

function loadData(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        return saved === null ? fallback : JSON.parse(saved);
    } catch (error) {
        return fallback;
    }
}

function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        alert("Could not save data. Check your browser storage.");
        return false;
    }
}

let tasks = loadData("lifeos_tasks", []);
let studies = loadData("lifeos_studies", []);
let habits = loadData("lifeos_habits", []);
let expenses = loadData("lifeos_expenses", []);

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

function makeButton(label, className, onClick) {
    const button = createElement("button", className, label);
    button.type = "button";
    button.addEventListener("click", onClick);
    return button;
}

function createListItem(text, actions = []) {
    const li = createElement("li");
    const content = createElement("span", "item-text", text);
    const actionBox = createElement("div", "item-actions");

    li.append(content);

    actions.forEach((action) => {
        actionBox.append(
            makeButton(action.label, action.className, action.onClick)
        );
    });

    if (actions.length) {
        li.append(actionBox);
    }

    return li;
}

// Date and greeting

function updateHeader() {
    const now = new Date();
    const hour = now.getHours();

    let greeting = "Good evening";

    if (hour < 12) {
        greeting = "Good morning";
    } else if (hour < 17) {
        greeting = "Good afternoon";
    }

    $("greeting").textContent = greeting + ", welcome to LifeOS!";

    $("currentDate").textContent = now.toLocaleDateString(
        undefined,
        {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

    $("year").textContent = now.getFullYear();
}

// Dashboard

function updateDashboard() {
    $("totalTasks").textContent = tasks.length;

    $("completedTasks").textContent = tasks.filter(
        task => task.done
    ).length;

    const totalHours = studies.reduce(
        (sum, item) => sum + item.hours,
        0
    );

    $("studyHours").textContent =
        Number(totalHours.toFixed(2)).toString();

    const totalSpent = expenses.reduce(
        (sum, item) => sum + item.amount,
        0
    );

    $("totalExpenses").textContent = totalSpent.toLocaleString(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }
    );
}

// Tasks

function renderTasks() {
    const list = $("taskList");
    list.replaceChildren();

    if (!tasks.length) {
        list.append(createElement("li", "", "No tasks yet. Add your first task!"));
    }

    tasks.forEach((task) => {
        const text = createElement(
            "span",
            "item-text" + (task.done ? " done" : ""),
            task.text
        );

        const actions = createElement("div", "item-actions");

        actions.append(
            makeButton(
                task.done ? "Undo" : "Done",
                "",
                () => {
                    task.done = !task.done;
                    saveData("lifeos_tasks", tasks);
                    renderTasks();
                    updateDashboard();
                }
            )
        );

        actions.append(
            makeButton(
                "Delete",
                "delete-btn",
                () => {
                    tasks = tasks.filter(item => item.id !== task.id);
                    saveData("lifeos_tasks", tasks);
                    renderTasks();
                    updateDashboard();
                }
            )
        );

        const li = createElement("li");
        li.append(text, actions);
        list.append(li);
    });
}

$("taskForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const text = $("taskInput").value.trim();

    if (!text) return;

    tasks.push({
        id: Date.now() + Math.random(),
        text,
        done: false
    });

    if (saveData("lifeos_tasks", tasks)) {
        $("taskInput").value = "";
        renderTasks();
        updateDashboard();
    }
});

// Study tracker

function renderStudies() {
    const list = $("studyList");
    list.replaceChildren();

    if (!studies.length) {
        list.append(createElement("li", "", "No study sessions recorded."));
    }

    studies.forEach((study) => {
        list.append(
            createListItem(
                `${study.subject} — ${study.hours} hour(s)`,
                [{
                    label: "Delete",
                    className: "delete-btn",
                    onClick: () => {
                        studies = studies.filter(item => item.id !== study.id);
                        saveData("lifeos_studies", studies);
                        renderStudies();
                        updateDashboard();
                    }
                }]
            )
        );
    });
}

$("studyForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const subject = $("subjectInput").value.trim();
    const hours = Number($("hoursInput").value);

    if (!subject || !Number.isFinite(hours) || hours <= 0 || hours > 24) {
        alert("Enter a subject and study time between 0 and 24 hours.");
        return;
    }

    studies.push({
        id: Date.now() + Math.random(),
        subject,
        hours
    });

    if (saveData("lifeos_studies", studies)) {
        $("subjectInput").value = "";
        $("hoursInput").value = "";
        renderStudies();
        updateDashboard();
    }
});

// Habit tracker

function renderHabits() {
    const list = $("habitList");
    list.replaceChildren();

    if (!habits.length) {
        list.append(createElement("li", "", "Add a habit you want to build."));
    }

    habits.forEach((habit) => {
        const text = habit.doneToday
            ? `${habit.text} — Completed today ✓`
            : habit.text;

        list.append(
            createListItem(
                text,
                [
                    {
                        label: habit.doneToday ? "Undo" : "Complete",
                        className: "",
                        onClick: () => {
                            habit.doneToday = !habit.doneToday;
                            saveData("lifeos_habits", habits);
                            renderHabits();
                        }
                    },
                    {
                        label: "Delete",
                        className: "delete-btn",
                        onClick: () => {
                            habits = habits.filter(item => item.id !== habit.id);
                            saveData("lifeos_habits", habits);
                            renderHabits();
                        }
                    }
                ]
            )
        );
    });
}

$("habitForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const text = $("habitInput").value.trim();

    if (!text) return;

    habits.push({
        id: Date.now() + Math.random(),
        text,
        doneToday: false
    });

    if (saveData("lifeos_habits", habits)) {
        $("habitInput").value = "";
        renderHabits();
    }
});

// Expenses

function renderExpenses() {
    const list = $("expenseList");
    list.replaceChildren();

    if (!expenses.length) {
        list.append(createElement("li", "", "No expenses recorded."));
    }

    expenses.forEach((expense) => {
        list.append(
            createListItem(
                `${expense.name} — ₹${expense.amount.toLocaleString("en-IN")}`,
                [{
                    label: "Delete",
                    className: "delete-btn",
                    onClick: () => {
                        expenses = expenses.filter(item => item.id !== expense.id);
                        saveData("lifeos_expenses", expenses);
                        renderExpenses();
                        updateDashboard();
                    }
                }]
            )
        );
    });
}

$("expenseForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const name = $("expenseName").value.trim();
    const amount = Number($("expenseAmount").value);

    if (!name || !Number.isFinite(amount) || amount <= 0) {
        alert("Enter a valid expense name and amount.");
        return;
    }

    expenses.push({
        id: Date.now() + Math.random(),
        name,
        amount
    });

    if (saveData("lifeos_expenses", expenses)) {
        $("expenseName").value = "";
        $("expenseAmount").value = "";
        renderExpenses();
        updateDashboard();
    }
});

// Notes

$("noteInput").value = loadData("lifeos_notes", "");

$("saveNote").addEventListener("click", () => {
    if (saveData("lifeos_notes", $("noteInput").value)) {
        $("noteStatus").textContent = "Notes saved successfully!";
    }
});

$("noteInput").addEventListener("input", () => {
    $("noteStatus").textContent = "";
});

// Theme

function applyTheme(dark) {
    document.body.classList.toggle("dark", dark);
    $("themeBtn").textContent = dark
        ? "☀️ Light Theme"
        : "🌙 Dark Theme";

    try {
        localStorage.setItem("lifeos_dark", String(dark));
    } catch (error) {
        // Theme still works for this session.
    }
}

let darkMode = loadData("lifeos_dark", false);

if (typeof darkMode !== "boolean") {
    darkMode = false;
}

applyTheme(darkMode);

$("themeBtn").addEventListener("click", () => {
    darkMode = !document.body.classList.contains("dark");
    applyTheme(darkMode);
});

// Initial rendering

updateHeader();
renderTasks();
renderStudies();
renderHabits();
renderExpenses();
updateDashboard();
