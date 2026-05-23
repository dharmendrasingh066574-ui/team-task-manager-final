const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(express.json());

// const serviceAccount = require("./serviceAccountKey.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
const SECRET_KEY = "teamtaskmanagersecret";

function authMiddleware(req, res, next){
  const authHeader = req.headers.authorization;
  if(!authHeader) return res.status(401).json({ message:"No token" });

  const token = authHeader.split(" ")[1];

  try{
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch(error){
    return res.status(401).json({ message:"Invalid token" });
  }
}

// app.post("/signup", async(req,res)=>{
//   try{
//     const {name,email,password,role} = req.body;

//     if(!name || !email || !password){
//       return res.status(400).json({ message:"All fields are required" });
//     }

//     const existingUser = await db.collection("users").where("email","==",email).get();

//     if(!existingUser.empty){
//       return res.status(400).json({ message:"User already exists" });
//     }

//     const hashedPassword = await bcrypt.hash(password,10);

//     await db.collection("users").add({
//       name,
//       email,
//       password:hashedPassword,
//       role: role || "member"
//     });

//     res.json({ message:"Signup successful" });

//   } catch(error){
//     res.status(500).json({ error:error.message });
//   }
// });

app.post("/signup", async(req,res)=>{

  try{

    const {name,email,password} = req.body;

    // ONLY THESE EMAILS CAN BECOME ADMIN

    const allowedAdmins = [

      "dhruvbhadauriya2020@gmail.com",
      "shivam2005singhram@gmail.com"

    ];

    if(!name || !email || !password){

      return res.status(400).json({
        message:"All fields are required"
      });

    }

    const existingUser =
    await db.collection("users")
    .where("email","==",email)
    .get();

    if(!existingUser.empty){

      return res.status(400).json({
        message:"User already exists"
      });

    }

    const hashedPassword =
    await bcrypt.hash(password,10);

    // AUTO ROLE ASSIGNMENT

    const finalRole =
    allowedAdmins.includes(email)
    ? "admin"
    : "member";

    await db.collection("users").add({

      name,
      email,
      password:hashedPassword,
      role: finalRole

    });

    res.json({
      message:"Signup successful"
    });

  }

  catch(error){

    res.status(500).json({
      error:error.message
    });

  }

});



app.post("/login", async(req,res)=>{
  try{
    const {email,password} = req.body;

    const snapshot = await db.collection("users").where("email","==",email).get();

    if(snapshot.empty){
      return res.status(400).json({ message:"User not found" });
    }

    const user = snapshot.docs[0];
    const userData = user.data();

    const validPassword = await bcrypt.compare(password, userData.password);

    if(!validPassword){
      return res.status(400).json({ message:"Wrong password" });
    }

    const token = jwt.sign({
      id:user.id,
      role:userData.role
    }, SECRET_KEY, { expiresIn:"7d" });

    res.json({
      token,
      role:userData.role,
      name:userData.name,
      userId:user.id
    });

  } catch(error){
    res.status(500).json({ error:error.message });
  }
});

app.post("/projects", authMiddleware, async(req, res) => {
  try {
    if(req.user.role !== "admin"){
      return res.status(403).json({ message: "Only admin can create projects" });
    }

    const { title, description } = req.body;

    if(!title || !description){
      return res.status(400).json({ message:"Project title and description required" });
    }

    await db.collection("projects").add({
      title,
      description,
      adminId: req.user.id,
      members: [],
      createdAt: new Date()
    });

    res.json({ message: "Project Created Successfully" });

  } catch(error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/projects", authMiddleware, async(req, res) => {
  try {
    const snapshot = await db.collection("projects").get();
    const projects = [];

    snapshot.forEach(doc => {
      projects.push({ id: doc.id, ...doc.data() });
    });

    res.json(projects);

  } catch(error) {
    res.status(500).json({ error: error.message });
  }
});

// app.post("/tasks", authMiddleware, async(req, res) => {
//   try {
//     if(req.user.role !== "admin"){
//       return res.status(403).json({ message:"Only admin can create tasks" });
//     }

//     const { title, description, dueDate, priority, projectId } = req.body;

//     if(!title || !description || !dueDate || !projectId){
//       return res.status(400).json({ message:"All task fields are required" });
//     }

//     await db.collection("tasks").add({
//       title,
//       description,
//       dueDate,
//       priority,
//       assignedTo: "member",
//       projectId,
//       status: "To Do",
//       createdAt: new Date()
//     });

//     res.json({ message: "Task Created Successfully" });

//   } catch(error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.get("/tasks", authMiddleware, async(req, res) => {
//   try {
//     const snapshot = await db.collection("tasks").get();
//     const tasks = [];

//     snapshot.forEach(doc => {
//       tasks.push({ id: doc.id, ...doc.data() });
//     });

//     res.json(tasks);

//   } catch(error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.put("/tasks/:id", authMiddleware, async(req, res) => {
//   try {
//     const { status } = req.body;

//     await db.collection("tasks").doc(req.params.id).update({ status });

//     res.json({ message:"Status Updated Successfully" });

//   } catch(error) {
//     res.status(500).json({ error:error.message });
//   }
// });


app.post("/tasks", authMiddleware, async(req, res) => {
  try {
    if(req.user.role !== "admin"){
      return res.status(403).json({ message:"Only admin can create tasks" });
    }

    const { title, description, dueDate, priority, projectId, assignedTo } = req.body;

    if(!title || !description || !dueDate || !projectId || !assignedTo){
      return res.status(400).json({ message:"All task fields are required" });
    }

    await db.collection("tasks").add({
      title,
      description,
      dueDate,
      priority,
      projectId,
      assignedTo,
      status: "To Do",
      createdAt: new Date()
    });

    res.json({ message: "Task Created Successfully" });

  } catch(error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/tasks", authMiddleware, async(req, res) => {
  try {
    const snapshot = await db.collection("tasks").get();
    const tasks = [];

    snapshot.forEach(doc => {
      const task = doc.data();

      if(req.user.role === "admin" || task.assignedTo === req.user.id){
        tasks.push({
          id: doc.id,
          ...task
        });
      }
    });

    res.json(tasks);

  } catch(error) {
    res.status(500).json({ error: error.message });
  }
});


app.get("/users", authMiddleware, async(req, res) => {
  try {
    if(req.user.role !== "admin"){
      return res.status(403).json({ message:"Only admin can view users" });
    }

    const snapshot = await db.collection("users").get();
    const users = [];

    snapshot.forEach(doc => {
      const data = doc.data();

      users.push({
        id: doc.id,
        name: data.name,
        email: data.email,
        role: data.role
      });
    });

    res.json(users);

  } catch(error) {
    res.status(500).json({ error:error.message });
  }
});

app.put("/users/:id/role", authMiddleware, async(req, res) => {
  try {
    if(req.user.role !== "admin"){
      return res.status(403).json({ message:"Only admin can update roles" });
    }

    const { role } = req.body;

    if(role !== "admin" && role !== "member"){
      return res.status(400).json({ message:"Invalid role" });
    }

    await db.collection("users").doc(req.params.id).update({
      role
    });

    res.json({ message:"User role updated successfully" });

  } catch(error) {
    res.status(500).json({ error:error.message });
  }
});

app.put("/projects/:id/add-member", authMiddleware, async(req,res)=>{
  try{
    if(req.user.role !== "admin"){
      return res.status(403).json({ message:"Only admin can add members" });
    }

    const { memberId } = req.body;

    const projectRef = db.collection("projects").doc(req.params.id);
    const projectDoc = await projectRef.get();

    if(!projectDoc.exists){
      return res.status(404).json({ message:"Project not found" });
    }

    const project = projectDoc.data();
    const members = project.members || [];

    if(!members.includes(memberId)){
      members.push(memberId);
    }

    await projectRef.update({ members });

    res.json({ message:"Member added to project" });

  } catch(error){
    res.status(500).json({ error:error.message });
  }
});

app.put("/projects/:id/remove-member", authMiddleware, async(req,res)=>{
  try{
    if(req.user.role !== "admin"){
      return res.status(403).json({ message:"Only admin can remove members" });
    }

    const { memberId } = req.body;

    const projectRef = db.collection("projects").doc(req.params.id);
    const projectDoc = await projectRef.get();

    if(!projectDoc.exists){
      return res.status(404).json({ message:"Project not found" });
    }

    const project = projectDoc.data();
    const members = project.members || [];

    const updatedMembers = members.filter(id => id !== memberId);

    await projectRef.update({ members: updatedMembers });

    res.json({ message:"Member removed from project" });

  } catch(error){
    res.status(500).json({ error:error.message });
  }
});



app.get("/dashboard", authMiddleware, async(req,res)=>{
  try{
    const snapshot = await db.collection("tasks").get();

    let totalTasks = 0;
    let completedTasks = 0;
    let pendingTasks = 0;
    let overdueTasks = 0;

    const today = new Date();

    snapshot.forEach(doc=>{
      const task = doc.data();
      totalTasks++;

      if(task.status === "Done") completedTasks++;
      else pendingTasks++;

      if(task.dueDate && new Date(task.dueDate) < today && task.status !== "Done"){
        overdueTasks++;
      }
    });

    res.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks
    });

  } catch(error){
    res.status(500).json({ error:error.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT,()=>{
  console.log(`Server running on port ${PORT}`);
});

