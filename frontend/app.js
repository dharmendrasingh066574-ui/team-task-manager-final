const API = "http://localhost:5000";

// ================= SIGNUP =================

async function signup(){
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    // const role = document.getElementById("role").value;

    if(!name || !email || !password){
        document.getElementById("message").innerHTML = "Please fill all fields";
        return;
    }

    const response = await fetch(`${API}/signup`,{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            name,
            email,
            password
        })
    });

    const data = await response.json();
    document.getElementById("message").innerHTML =
    data.message || data.error;
}

// ================= LOGIN =================

async function login(){
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if(!email || !password){
        document.getElementById("message").innerHTML = "Please enter email and password";
        return;
    }

    const response = await fetch(`${API}/login`,{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            email,
            password
        })
    });

    const data = await response.json();

    if(data.token){
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("name", data.name);

        window.location.href = "dashboard.html";
    } else {
        document.getElementById("message").innerHTML =
        data.message || data.error || "Login failed";
    }
}
