
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "100kb" }));

const dataDir = path.join(__dirname, "data");
const profilesFile = path.join(dataDir, "profiles.json");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(profilesFile)) {
  fs.writeFileSync(profilesFile, "[]");
}

function readProfiles() {
  return JSON.parse(fs.readFileSync(profilesFile, "utf8"));
}

function saveProfiles(profiles) {
  fs.writeFileSync(profilesFile, JSON.stringify(profiles, null, 2));
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    name: "SkillSprint AI",
    message: "Backend is running"
  });
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "OK" });
});

app.post("/api/profile", (req, res) => {
  const { name, education, career, skills = "" } = req.body;

  if (
    typeof name !== "string" || !name.trim() ||
    typeof education !== "string" || !education.trim() ||
    typeof career !== "string" || !career.trim()
  ) {
    return res.status(400).json({
      success: false,
      message: "Name, education and career are required."
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
      completedTasks: [],
      createdAt: new Date().toISOString()
    };

    profiles.push(profile);
    saveProfiles(profiles);

    res.status(201).json({
      success: true,
      profile
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Could not save profile."
    });
  }
});

app.get("/api/profiles", (req, res) => {
  try {
    const profiles = readProfiles();

    res.json({
      success: true,
      count: profiles.length,
      profiles: profiles.map(({ id, name, education, career, createdAt }) => ({
        id, name, education, career, createdAt
      }))
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Could not load profiles."
    });
  }
});

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
  } catch {
    res.status(500).json({
      success: false,
      message: "Could not load profile."
    });
  }
});

app.put("/api/profile/:id", (req, res) => {
  try {
    const profiles = readProfiles();
    const profile = profiles.find(item => item.id === req.params.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found."
      });
    }

    for (const field of ["name", "education", "career"]) {
      if (req.body[field] !== undefined) {
        if (
          typeof req.body[field] !== "string" ||
          !req.body[field].trim()
        ) {
          return res.status(400).json({
            success: false,
            message: `${field} must be non-empty text.`
          });
        }

        profile[field] = req.body[field].trim();
      }
    }

    if (req.body.skills !== undefined) {
      profile.skills = req.body.skills;
    }

    saveProfiles(profiles);
    res.json({ success: true, profile });
  } catch {
    res.status(500).json({
      success: false,
      message: "Could not update profile."
    });
  }
});

app.delete("/api/profile/:id", (req, res) => {
  try {
    const profiles = readProfiles();
    const updated = profiles.filter(item => item.id !== req.params.id);

    if (updated.length === profiles.length) {
      return res.status(404).json({
        success: false,
        message: "Profile not found."
      });
    }

    saveProfiles(updated);
    res.json({ success: true, message: "Profile deleted." });
  } catch {
    res.status(500).json({
      success: false,
      message: "Could not delete profile."
    });
  }
});

const roadmaps = {
  sdr: [
    "Communication Skills", "Sales Fundamentals", "CRM Basics",
    "Cold Calling", "Email Outreach", "Lead Research",
    "Interview Preparation", "Job Applications"
  ],
  web: [
    "HTML", "CSS", "JavaScript", "Git and GitHub",
    "Responsive Design", "APIs", "Build Projects", "Create Portfolio"
  ],
  data: [
    "Excel", "SQL", "Statistics", "Power BI",
    "Python Basics", "Data Projects", "Portfolio", "Apply for Jobs"
  ],
  hr: [
    "Communication Skills", "HR Fundamentals", "Recruitment",
    "Excel", "Interview Coordination", "HR Software",
    "Resume Preparation", "Apply for Jobs"
  ],
  finance: [
    "Accounting Fundamentals", "Advanced Excel", "Tally",
    "GST Basics", "Financial Analysis", "Practical Projects",
    "Resume Preparation", "Apply for Jobs"
  ],
  marketing: [
    "Marketing Fundamentals", "Social Media Marketing",
    "Content Creation", "SEO Basics", "Digital Advertising",
    "Marketing Analytics", "Build a Portfolio", "Apply for Jobs"
  ]
};

app.post("/api/roadmap", (req, res) => {
  const { career, skills = [] } = req.body;

  if (typeof career !== "string" || !career.trim()) {
    return res.status(400).json({
      success: false,
      message: "Career is required."
    });
  }

  const tasks = roadmaps[career.trim().toLowerCase()] || [
    "Research your career",
    "Learn industry fundamentals",
    "Develop practical skills",
    "Complete projects",
    "Prepare your resume",
    "Practise interviews",
    "Apply for jobs"
  ];

  res.json({
    success: true,
    career: career.trim(),
    currentSkills: skills,
    roadmap: tasks.map((title, index) => ({
      step: index + 1,
      title,
      completed: false
    }))
  });
});

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
    const profile = profiles.find(item => item.id === req.params.id);

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
  } catch {
    res.status(500).json({
      success: false,
      message: "Could not save progress."
    });
  }
});

app.post("/api/interview", (req, res) => {
  const { question = "", answer } = req.body;

  if (typeof answer !== "string" || !answer.trim()) {
    return res.status(400).json({
      success: false,
      message: "Interview answer is required."
    });
  }

  if (answer.length > 10000) {
    return res.status(400).json({
      success: false,
      message: "Answer is too long."
    });
  }

  const wordCount = answer.trim().split(/\s+/).length;

  let feedback;
  let suggestions;

  if (wordCount < 10) {
    feedback = "Your answer needs more detail.";
    suggestions = [
      "Explain your background.",
      "Mention a relevant skill.",
      "Add an example."
    ];
  } else if (wordCount < 30) {
    feedback = "Good start. Add a specific example.";
    suggestions = [
      "Explain the situation.",
      "Describe your actions.",
      "Share the result."
    ];
  } else {
    feedback = "Your answer contains useful detail.";
    suggestions = [
      "Keep the answer focused.",
      "Use the STAR method where appropriate.",
      "Include genuine examples."
    ];
  }

  res.json({
    success: true,
    question,
    wordCount,
    feedback,
    suggestions,
    method: "Rule-based feedback"
  });
});

app.post("/api/resume", (req, res) => {
  const {
    name, email = "", phone = "", role,
    about = "", skills = "", education = "", projects = ""
  } = req.body;

  if (
    typeof name !== "string" || !name.trim() ||
    typeof role !== "string" || !role.trim()
  ) {
    return res.status(400).json({
      success: false,
      message: "Name and target role are required."
    });
  }

  const skillsText = Array.isArray(skills)
    ? skills.join(", ")
    : String(skills);

  const resume = [
    name.trim(),
    role.trim(),
    email,
    phone,
    "",
    "PROFILE",
    about,
    "",
    "SKILLS",
    skillsText,
    "",
    "EDUCATION",
    education,
    "",
    "PROJECTS",
    projects
  ].join("\n");

  res.json({ success: true, resume });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found."
  });
});

app.use((err, req, res, next) => {
  console.error(err.message);

  if (err instanceof SyntaxError && err.status === 400) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body."
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error."
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`SkillSprint AI backend running on port ${PORT}`);
});
