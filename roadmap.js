
const express = require("express");
const router = express.Router();

const roadmaps = {
  sdr: [
    "Communication Skills",
    "Sales Fundamentals",
    "CRM Basics",
    "Cold Calling",
    "Email Outreach",
    "Lead Research",
    "Interview Preparation",
    "Job Applications"
  ],
  web: [
    "HTML Fundamentals",
    "CSS and Responsive Design",
    "JavaScript",
    "Git and GitHub",
    "APIs",
    "Build Projects",
    "Create a Portfolio",
    "Apply for Jobs"
  ],
  data: [
    "Excel",
    "SQL",
    "Statistics",
    "Power BI",
    "Python Basics",
    "Data Projects",
    "Portfolio",
    "Apply for Jobs"
  ],
  hr: [
    "Communication Skills",
    "HR Fundamentals",
    "Recruitment Basics",
    "Excel",
    "Interview Coordination",
    "HR Software",
    "Resume Preparation",
    "Apply for Jobs"
  ],
  finance: [
    "Accounting Fundamentals",
    "Advanced Excel",
    "Tally",
    "GST Basics",
    "Financial Analysis",
    "Practical Projects",
    "Resume Preparation",
    "Apply for Jobs"
  ],
  marketing: [
    "Marketing Fundamentals",
    "Social Media Marketing",
    "Content Creation",
    "SEO Basics",
    "Digital Advertising",
    "Marketing Analytics",
    "Build a Portfolio",
    "Apply for Jobs"
  ]
};

router.post("/", (req, res) => {
  const { career, skills = [] } = req.body;

  if (typeof career !== "string" || !career.trim()) {
    return res.status(400).json({
      success: false,
      message: "Please provide a career goal."
    });
  }

  const key = career.trim().toLowerCase();

  const tasks = roadmaps[key] || [
    "Research your chosen career",
    "Learn the required fundamentals",
    "Develop practical skills",
    "Complete relevant projects",
    "Prepare your resume",
    "Practise interviews",
    "Apply for suitable opportunities"
  ];

  res.json({
    success: true,
    career: career.trim(),
    currentSkills: Array.isArray(skills)
      ? skills
      : typeof skills === "string"
        ? skills.split(",").map(skill => skill.trim()).filter(Boolean)
        : [],
    roadmap: tasks.map((title, index) => ({
      step: index + 1,
      title,
      completed: false
    }))
  });
});

module.exports = router;
