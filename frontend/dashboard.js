const API = "https://team-task-manager-final-production-9108.up.railway.app";
// ================= SIDEBAR =================

function loadSidebar(){
    const role = localStorage.getItem("role");
    const adminControls = document.getElementById("adminControls");
    const taskHeading = document.querySelector(".all-tasks h2");

    if(role === "admin"){
        document.body.classList.add("admin");
        document.body.classList.remove("member");

        if(adminControls) adminControls.style.display = "block";
        if(taskHeading) taskHeading.innerHTML = "All Tasks";

        // document.getElementById("sidebarMenu").innerHTML = `
        //     <li>Dashboard</li>
        //     <li>Create Project</li>
        //     <li>Create Task</li>
        //     <li>Manage Members</li>
        //     <li>All Tasks</li>
        // `;
        document.getElementById("sidebarMenu").innerHTML = `

        <li onclick="scrollToSection('dashboardSection')">
        Dashboard
        </li>

        <li onclick="scrollToSection('projectSection')">
        Create Project
        </li>

        <li onclick="scrollToSection('taskSection')">
        Create Task
        </li>

        <li onclick="scrollToSection('manageMembersSection')">
        Manage Members
        </li>

        <li onclick="scrollToSection('allTasksSection')">
        All Tasks
        </li>
        
        `;

    } else {
        document.body.classList.add("member");
        document.body.classList.remove("admin");

        if(adminControls) adminControls.style.display = "none";
        if(taskHeading) taskHeading.innerHTML = "My Tasks";

        document.getElementById("sidebarMenu").innerHTML = `

        <li onclick="scrollToSection('dashboardSection')">
        Dashboard
        </li>

        <li onclick="scrollToSection('allTasksSection')">
        My Tasks
        </li>
    

        `;

        // document.getElementById("sidebarMenu").innerHTML = `
        //     <li>Dashboard</li>
        //     <li>My Tasks</li>
        // `;
    }
}

// ================= DASHBOARD =================

async function loadDashboard(){
    const token = localStorage.getItem("token");

    if(!token){
        window.location.href = "index.html";
        return;
    }

    const response = await fetch(`${API}/dashboard`, {
        headers:{
            Authorization:`Bearer ${token}`
        }
    });

    const data = await response.json();

    document.getElementById("tasks").innerHTML = data.totalTasks || 0;
    document.getElementById("completed").innerHTML = data.completedTasks || 0;
    document.getElementById("pending").innerHTML = data.pendingTasks || 0;
    document.getElementById("overdue").innerHTML = data.overdueTasks || 0;
}

// ================= CREATE PROJECT =================

async function createProject(){
    const title = document.getElementById("projectTitle").value.trim();
    const description = document.getElementById("projectDesc").value.trim();
    const token = localStorage.getItem("token");

    if(!title || !description){
        alert("Please enter project title and description");
        return;
    }

    const response = await fetch(`${API}/projects`, {
        method:"POST",
        headers:{
            "Content-Type":"application/json",
            Authorization:`Bearer ${token}`
        },
        body:JSON.stringify({ title, description })
    });

    const data = await response.json();
    alert(data.message || data.error);

    document.getElementById("projectTitle").value = "";
    document.getElementById("projectDesc").value = "";

    loadProjects();
    loadProjectOptions();
}

// ================= LOAD PROJECTS =================

async function loadProjects(){
    const token = localStorage.getItem("token");

    const response = await fetch(`${API}/projects`, {
        headers:{
            Authorization:`Bearer ${token}`
        }
    });

    const projects = await response.json();
    let html = "";

    projects.forEach(project => {
        html += `
            <div class="project-card">
                <h3>${project.title}</h3>
                <p>${project.description}</p>
            </div>
        `;
    });

    const projectList = document.getElementById("projectList");
    if(projectList) projectList.innerHTML = html;
}

// ================= PROJECT OPTIONS =================

async function loadProjectOptions(){
    const token = localStorage.getItem("token");
    const projectSelect = document.getElementById("projectSelect");

    if(!projectSelect) return;

    const response = await fetch(`${API}/projects`, {
        headers:{
            Authorization:`Bearer ${token}`
        }
    });

    const projects = await response.json();
    let html = `<option value="">Select Project</option>`;

    projects.forEach(project=>{
        html += `
            <option value="${project.id}">
                ${project.title}
            </option>
        `;
    });

    projectSelect.innerHTML = html;
}

// ================= CREATE TASK =================

async function createTask(){
    const title = document.getElementById("taskTitle").value.trim();
    const description = document.getElementById("taskDesc").value.trim();
    const dueDate = document.getElementById("dueDate").value;
    const priority = document.getElementById("priority").value;
    const projectId = document.getElementById("projectSelect").value;
    const token = localStorage.getItem("token");
    const assignedTo = document.getElementById("memberSelect").value;

   if(!title || !description || !dueDate || !projectId || !assignedTo){
    alert("Please fill all task fields, select project and member");
    return;
}
    const response = await fetch(`${API}/tasks`, {
        method:"POST",
        headers:{
            "Content-Type":"application/json",
            Authorization:`Bearer ${token}`
        },
        body:JSON.stringify({
            title,
            description,
            dueDate,
            priority,
            projectId,
            assignedTo
        })
    });

    const data = await response.json();
    alert(data.message || data.error);

    document.getElementById("taskTitle").value = "";
    document.getElementById("taskDesc").value = "";
    document.getElementById("dueDate").value = "";
    document.getElementById("projectSelect").value = "";

    loadDashboard();
    loadTasks();
}

// ================= LOAD TASKS =================

async function loadTasks(){
    const token = localStorage.getItem("token");

    const response = await fetch(`${API}/tasks`, {
        headers:{
            Authorization:`Bearer ${token}`
        }
    });

    const tasks = await response.json();
    let html = "";

    tasks.forEach(task=>{
        html += `
            <div class="task-card">
                <h3>${task.title}</h3>
                <p>${task.description}</p>
                <p><b>Due:</b> ${task.dueDate}</p>
                <p><b>Project ID:</b> ${task.projectId || "N/A"}</p>

                <div class="priority">${task.priority}</div>

                <br><br>

                <select onchange="updateStatus('${task.id}', this.value)">
                    <option value="To Do" ${task.status === "To Do" ? "selected" : ""}>To Do</option>
                    <option value="In Progress" ${task.status === "In Progress" ? "selected" : ""}>In Progress</option>
                    <option value="Done" ${task.status === "Done" ? "selected" : ""}>Done</option>
                </select>
            </div>
        `;
    });

    document.getElementById("taskList").innerHTML = html;
}

// ================= UPDATE STATUS =================

async function updateStatus(id,status){
    const token = localStorage.getItem("token");

    const response = await fetch(`${API}/tasks/${id}`, {
        method:"PUT",
        headers:{
            "Content-Type":"application/json",
            Authorization:`Bearer ${token}`
        },
        body:JSON.stringify({ status })
    });

    const data = await response.json();
    alert(data.message || data.error);

    loadTasks();
    loadDashboard();
}

async function loadUsers(){
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if(role !== "admin") return;

    const response = await fetch(`${API}/users`, {
        headers:{
            Authorization:`Bearer ${token}`
        }
    });

    const users = await response.json();

    let html = "";

    users.forEach(user => {
        html += `
            <div class="user-card">
                <h3>${user.name}</h3>
                <p>${user.email}</p>
                <p>Current Role: ${user.role}</p>

                <select onchange="updateUserRole('${user.id}', this.value)">
                    <option value="member" ${user.role === "member" ? "selected" : ""}>Member</option>
                    <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
                </select>
            </div>
        `;
    });

    document.getElementById("userList").innerHTML = html;
}

async function updateUserRole(userId, role){
    const token = localStorage.getItem("token");

    const response = await fetch(`${API}/users/${userId}/role`, {
        method:"PUT",
        headers:{
            "Content-Type":"application/json",
            Authorization:`Bearer ${token}`
        },
        body:JSON.stringify({ role })
    });

    const data = await response.json();

    alert(data.message || data.error);

    loadUsers();
}

function scrollToSection(id){

    document.getElementById(id)
    .scrollIntoView({

        behavior:"smooth"

    });

}

async function loadMemberOptions(){
    const token = localStorage.getItem("token");
    const memberSelect = document.getElementById("memberSelect");

    if(!memberSelect) return;

    const response = await fetch(`${API}/users`, {
        headers:{
            Authorization:`Bearer ${token}`
        }
    });

    const users = await response.json();

    let html = `<option value="">Assign To Member</option>`;

    users.forEach(user => {
        if(user.role === "member"){
            html += `
                <option value="${user.id}">
                    ${user.name} - ${user.email}
                </option>
            `;
        }
    });

    memberSelect.innerHTML = html;
}

// ================= LOGOUT =================

function logout(){
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "index.html";
}

// ================= INITIAL LOAD =================

loadSidebar();
loadDashboard();
loadProjects();
loadProjectOptions();
loadTasks();
loadUsers();
loadMemberOptions();
