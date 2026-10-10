
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const roadmapRoutes = require("./routes/roadmap");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "100kb" }));

// Data storage
const dataDirectory = path.join(__dirname, "data");
const profilesFile = path.join(dataDirectory, "profiles.json");

if (!fs.existsSync(dataDirectory)) {
  fs.mkdirSync(dataDirectory, { recursive: true });
}

if (!fs.existsSync(profilesFile)) {
  fs.writeFileSync(profilesFile, "[]");
}

function readProfiles() {
  try {
    const content = fs.readFileSync(profilesFile, "utf8");
    const profiles = JSON.parse(content);

    return Array.isArray(profiles) ? profiles : [];
  } catch (error) {
    throw new Error("Could not read profile storage.");
  }
}

function saveProfiles(profiles) {
  fs.writeFileSync(
    profilesFile,
    JSON.stringify(profiles, null, 2),
    "utf8"
  );
}

// Home
app.get("/", (req, res) => {
  res.json({
    success: true,
    name: "SkillSprint AI",
    message: "Backend is running",
    version: "1.0.0"
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "OK"
  });
});

// Career roadmap
app.use("/api/roadmap", roadmapRoutes);

// Create profile
app.post("/api/profile", (req, res) => {
  const { name, education, career, skills = "" } = req.body;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof education !== "string" ||
    !education.trim() ||
    typeof career !== "string" ||
    !career.trim()
  ) {
    return res.status(400).json({
      success: false,
      message: "Name, education and career are required."
    });
  }

  if (typeof skills !== "string" && !Array.isArray(skills)) {
    return res.status(400).json({
      success: false,
      message: "Skills must be text or an array."
    });
  }

  try {
    const profiles = readProfiles();

    const profile = {
      id: crypto.randomUUID(),
      name: name.trim(),
      education: education.trim(),
      career: career.trim(),
      skills,
      createdAt: new Date().toISOString(),
      completedTasks: []
    };

    profiles.push(profile);
    saveProfiles(profiles);

    res.status(201).json({
      success: true,
      message: "Profile created.",
      profile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not save the profile."
    });
  }
});

// List profiles
app.get("/api/profiles", (req, res) => {
  try {
    const profiles = readProfiles();

    // Return only basic profile details.
    res.json({
      success: true,
      count: profiles.length,
      profiles: profiles.map(profile => ({
        id: profile.id,
        name: profile.name,
        education: profile.education,
        career: profile.career,
        createdAt: profile.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not load profiles."
    });
  }
});

// Get one profile
app.get("/api/profile/:id", (req, res) => {
  try {
    const profile = readProfiles().find(
      item => item.id === req.params.id
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found."
      });
    }

    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not load profile."
    });
  }
});

// Update profile
app.put("/api/profile/:id", (req, res) => {
  const { name, education, career, skills } = req.body;

  try {
    const profiles = readProfiles();
    const index = profiles.findIndex(
      item => item.id === req.params.id
    );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Profile not found."
      });
    }

    const current = profiles[index];

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name must be non-empty text."
        });
      }
      current.name = name.trim();
    }

    if (education !== undefined) {
      if (typeof education !== "string" || !education.trim()) {
        return res.status(400).json({
          success: false,
          message: "Education must be non-empty text."
        });
      }
      current.education = education.trim();
    }

    if (career !== undefined) {
      if (typeof career !== "string" || !career.trim()) {
        return res.status(400).json({
          success: false,
          message: "Career must be non-empty text."
        });
      }
      current.career = career.trim();
    }

    if (skills !== undefined) {
      if (typeof skills !== "string" && !Array.isArray(skills)) {
        return res.status(400).json({
          success: false,
          message: "Skills must be text or an array."
        });
      }
      current.skills = skills;
    }

    profiles[index] = current;
    saveProfiles(profiles);

    res.json({
      success: true,
      message: "Profile updated.",
      profile: current
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not update profile."
    });
  }
});

// Delete profile
app.delete("/api/profile/:id", (req, res) => {
  try {
    const profiles = readProfiles();
    const updated = profiles.filter(
      item => item.id !== req.params.id
    );

    if (updated.length === profiles.length) {
      return res.status(404).json({
        success: false,
        message: "Profile not found."
      });
    }

    saveProfiles(updated);

    res.json({
      success: true,
      message: "Profile deleted."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not delete profile."
    });
  }
});

// Save completed roadmap tasks
app.put("/api/progress/:id", (req, res) => {
  const { completedTasks } = req.body;

  if (
    !Array.isArray(completedTasks) ||
    !completedTasks.every(task => typeof task === "string")
  ) {
    return res.status(400).json({
      success: false,
      message: "completedTasks must be an array of strings."
    });
  }

  try {
    const profiles = readProfiles();
    const profile = profiles.find(
      item => item.id === req.params.id
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found."
      });
    }

    profile.completedTasks = [...new Set(completedTasks)];
    saveProfiles(profiles);

    res.json({
      success: true,
      completedTasks: profile.completedTasks,
      completedCount: profile.completedTasks.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not save progress."
    });
  }
});

// Interview feedback
app.post("/api/interview", (req, res) => {
  const { question, answer } = req.body;

  if (
    typeof answer !== "string" ||
    !answer.trim()
  ) {
    return res.status(400).json({
      success: false,
      message: "Please provide an interview answer."
    });
  }

  if (answer.length > 10000) {
    return res.status(400).json({
      success: false,
      message: "Answer is too long."
    });
  }

  const words = answer.trim().split(/\s+/);
  const wordCount = words.length;

  let feedback;
  let suggestions = [];

  if (wordCount < 10) {
    feedback = "Your answer needs more detail.";
    suggestions = [
      "Explain your background.",
      "Mention a relevant skill.",
      "Add a practical example."
    ];
  } else if (wordCount < 30) {
    feedback = "Good start. Expand your answer with a specific example.";
    suggestions = [
      "Explain the situation.",
      "Describe your action.",
      "Share the result or lesson learned."
    ];
  } else {
    feedback = "Your answer has useful detail.";
    suggestions = [
      "Keep the answer focused.",
      "Use the STAR method when appropriate.",
      "Support your points with genuine examples."
    ];
  }

  res.json({
    success: true,
    question: typeof question === "string" ? question : "",
    wordCount,
    feedback,
    suggestions,
    method: "Rule-based feedback, not an AI evaluation"
  });
});

// Resume text generation
app.post("/api/resume", (req, res) => {
  const {
    name,
    email,
    phone,
    role,
    about,
    skills,
    education,
    projects
  } = req.body;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof role !== "string" ||
    !role.trim()
  ) {
    return res.status(400).json({
      success: false,
      message: "Name and target role are required."
    });
  }

  const resume = [
    name.trim(),
    role.trim(),
    email || "",
    phone || "",
    "",
    "PROFILE",
    about || "",
    "",
    "SKILLS",
    Array.isArray(skills) ? skills.join(", ") : (skills || ""),
    "",
    "EDUCATION",
    education || "",
    "",
    "PROJECTS",
    projects || ""
  ].join("\n");

  res.json({
    success: true,
    resume
  });
});

// Not found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found."
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.message);

  res.status(500).json({
    success: false,
    message: "An unexpected server error occurred."
  });
});

app.listen(PORT, () => {
  console.log(`SkillSprint AI backend running at http://localhost:${PORT}`);
});
