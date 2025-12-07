📚 StudyBuddy — AI-Powered Personalized Learning Assistant

StudyBuddy is a full-stack intelligent learning platform designed to help students organize their study routine, generate quizzes, receive tutoring, and interact with an AI-powered study assistant.
Built with Next.js, Supabase, Docker, and Groq (LLaMA 3.1) — it provides a seamless, fast, and personalized learning experience.

🚀 Features Overview
🤖 AI Chatbot (Study Assistant)

Uses Groq LLaMA 3.1 8B Instant

Understands your tasks, quiz history, and study time

Gives personalized suggestions & study plans

Supports contextual conversation memory stored in Supabase

🎓 AI Tutor

Helps explain subjects and concepts in:

Short / concise

Step-by-step

Detailed / conceptual

Uses markdown formatting for clarity

Tracks conversation history for continuity

📝 Dynamic AI Quiz Generator

Generates multiple-choice quizzes using AI

All questions follow strict JSON structure

Verified using Zod schemas

Automatically stored in Supabase

Includes:

4 options

Correct answer index

Explanation

🔐 User Authentication (Supabase Auth)

Email + password login

Email verification support

JWT-based secure session management

Enforced server-side protection on all AI endpoints

📊 Dashboard & Planner

Today's tasks

Weekly study time

Quiz performance charts

AI assistant uses this data for personalized responses

🐳 Docker Support

Fully containerized build

Production Dockerfile

docker-compose support

Automatic environment variable injection via .env

🛠️ Tech Stack
Frontend

Next.js 16 (App Router + Server Components)

TypeScript

TailwindCSS

React

Backend

Supabase (PostgreSQL, Auth, Storage)

Groq AI API (LLaMA 3.1 models)

Zod validation

Node.js

DevOps

Docker

docker-compose

Environment Driven Configuration
