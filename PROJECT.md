PROJECT.md: Calibre - Autonomous Business Intelligence for Creators

1. Product Vision
   Calibre is an autonomous AI Agent that manages the business side of content creation.

The Problem: Professional creators (like "Dani") are overwhelmed by "Administrative Burnout"—the constant stress of updating media kits, tracking manual brand payments, and managing multi-platform metrics.

The Transformation: Calibre shifts the paradigm from Manual Management (reactive, fragmented, and exhausting) to Autonomous Intelligence (proactive, integrated, and self-improving). It acts as a "Digital Chief of Staff" that observes data, reasons through opportunities, and acts on behalf of the creator.

2. Target Users
   Tier 1: Individual Creators
   Profile: Full-time vloggers, streamers, or educators (YouTube/Instagram) with 20k-300k followers.

Pain Points: Outdated PDFs, chasing payments, forgetting sponsor deadlines.

Willingness to Pay: High ($12-$29/mo) for tools that save 10+ hours of "boring" work.

Tier 2: Talent Agencies and Managers
Profile: Boutique agencies managing 10-30 creators.

Pain Points: Impossible to scale without hiring more managers; data silos; manual reporting for brands.

Willingness to Pay: Premium ($79+/mo) for an "Agency Force Multiplier" that automates reporting across their entire roster.

3. Core Features (MVP)
   A. Brand Deals CRM (The Action Center)
   What it does: Tracks the lifecycle of a sponsorship (Negotiation -> Contract -> Delivery -> Payment).

Problem it solves: Prevents "lost revenue" due to forgotten follow-ups or missed payment dates.

AI Agent Enhancement: The agent scans Gmail/Calendar via MCP to automatically move deal stages and notifies the user: "Payment for the Nike campaign is 2 days late. Should I draft a follow-up?"

B. Content Pipeline (The Strategy Hub)
What it does: Centralizes the production schedule across YouTube and Instagram.

Problem it solves: Reduces the "platform switch" fatigue.

AI Agent Enhancement: Detects engagement spikes on specific videos and suggests: "This topic is trending in your stats; I've added a 'Part 2' draft to your pipeline."

C. Live Media Kit (The Sales Tool)
What it does: A public, dynamic URL (calibre.app/user) that displays live metrics.

Problem it solves: Eliminates the need for static, instantly-obsolete PDF media kits.

AI Agent Enhancement: Automatically highlights the "best performing video of the week" and updates the "Audience Demographic" card without user input.

4. AI Agent Behavior (The Brain)
   The Heartbeat Loop
   The agent operates on a recursive loop every 6 hours:

Observe: Fetch data from YouTube API, Instagram API, and Google Calendar.

Reason: Compare current data with historical benchmarks and business goals.

Plan: Identify tasks (e.g., "Need to update portfolio," "Need to chase payment").

Act: Execute tool calls (Email drafts, DB updates).

Remember: Log the outcome to the actions_log to refine future reasoning.

Risk Levels for Autonomy
Level 1 (Automatic): Updating internal database, syncing metrics, refreshing the Live Media Kit.

Level 2 (Conditional): Drafting emails, moving CRM stages (requires "one-click" user approval).

Level 3 (Restricted): Deleting data, sending live emails, or changing pricing (always requires manual override).

Memory and Context Strategy
Calibre uses Long-term Vector Memory for creator preferences (e.g., "Dani prefers a professional but friendly tone") and Short-term Context for current active campaigns.

5. Tech Stack
   Frontend: React + Vite + Typescript + Tailwind CSS. Justification: SEO for Media Kits and fast development.

Animations: GSAP. Justification: For a "Cinematic" UI that feels high-end and premium.

Backend/DB: Nodejs + Express + Supabase (PostgreSQL). Justification: Real-time subscriptions and built-in Auth.

AI Reasoning: Gemini 1.5 Pro. Justification: Native support for long context and multimodal reasoning.

Agent Framework: Google Agent Development Kit (ADK). Justification: Challenge requirement and lifecycle management.

Connectivity: Model Context Protocol (MCP). Justification: Secure, standardized way to connect Gemini to external APIs.

6. Architecture Pattern: Screaming Architecture
   We use a Domain-Driven Design (DDD) approach. Looking at the folder structure should "scream" what the app does, not what framework it uses.

/domain/creators: Logic for profiles and media kits.

/domain/deals: Logic for CRM and finances.

/domain/agent: The Heartbeat loop and Gemini orchestration.

/infrastructure: Supabase clients and API wrappers.

7. Hackathon Context: Google for Startups AI Agent Challenge
   Challenge Track: Track 1 (Net-New Agents).

Deadline: June 5th, 2026.

Google Tech: Gemini 1.5 Pro, Vertex AI, ADK, Google Cloud Functions.

Winning Angle: "Calibre is the first Agentic CRM for the Creator Economy that uses Gemini to bridge the gap between creative content and business revenue autonomously."

Competitive Advantage: No existing tool in Spanish targets the
operational layer of content creation. Calibre fills a gap
validated through direct outreach to Hispanic creators in the
20k–300k subscriber range.

8. Business Model
   Target Market: Hispanic Creators (LATAM + Spain). Note: UI is Spanish, but codebase/docs are English.

Tiers:

Creador ($12/mo): Basic CRM + 1 Live Media Kit.

Pro ($29/mo): Full AI Agent features + 5 automated reports/mo.

Estudio ($79/mo): Agency dashboard + Multi-creator management.

Go-to-Market: Leverage the "Verified by Google" status from the hackathon to sign the first 50 pilot users from the Hispanic vlogger community.

9. Out of Scope (MVP)
   Native Mobile Apps (iOS/Android) — Web-app only for now.

Automatic Payment Processing (Stripe integration comes post-MVP).

Direct Video Uploads — Calibre manages the business, not the hosting.

10. Success Metrics
    Time-to-Value: A user can deploy a Live Media Kit in < 2 minutes.

Agent Efficacy: > 70% of Agent-suggested actions are "Approved" by the user.

Reliability: 100% successful data sync via MCP during the 3-minute judge demo.

Single Source of Truth - Version 1.0
Created for the 2026 Google AI Agent Challenge
