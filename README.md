 <div align="center">

# SELAMCHAT

**Anonymous real-time conversations. No accounts. No profiles. Just connection.**

[![Website](https://img.shields.io/badge/WEBSITE-selamchat.fun-7a4dff?style=flat-square&labelColor=0d0d10)](https://selamchat.fun)
[![Repository](https://img.shields.io/badge/GitHub-Repository-ffffff?style=flat-square&logo=github&logoColor=white&labelColor=0d0d10&color=7a4dff)](https://github.com/karadayiefe/SELAMCHAT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Application-3178c6?style=flat-square&logo=typescript&logoColor=white&labelColor=0d0d10)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-Frontend-61dafb?style=flat-square&logo=react&logoColor=white&labelColor=0d0d10)](https://react.dev/)
[![License](https://img.shields.io/badge/license-see_repository-534dff?style=flat-square&labelColor=0d0d10)](./LICENSE)

[Website](https://selamchat.fun) • [Features](#features) • [How It Works](#how-it-works) • [Architecture](#architecture) • [Getting Started](#getting-started) • [Privacy](#privacy)

<br/>

<img src="./selamchat-preview.png" alt="SELAMCHAT — Anonymous Live Chat" width="100%" />

<br/>

*Every conversation starts with a hello.*

</div>

---

## Overview

SELAMCHAT is an anonymous live chat platform that randomly connects people for spontaneous conversations.

No registration. No accounts. No profiles.

Every session receives a temporary animal identity. Join the queue, meet someone new, and start talking.

## Features

| Feature | Description |
|:--|:--|
| **Anonymous Matching** | Connect with another person without creating an account. |
| **Real-time Messaging** | Exchange messages during live conversations. |
| **Temporary Identities** | Every session receives an automatically assigned animal name. |
| **Random Connections** | Meet someone new through the matching queue. |
| **Temporary Sessions** | Conversations exist only while the session is active. |
| **Automatic Cleanup** | Messages are deleted when either participant leaves. |

---

## How It Works

<div align="center">

| 01 | 02 | 03 | 04 |
|:--:|:--:|:--:|:--:|
| **JOIN** | **MATCH** | **CHAT** | **LEAVE** |
| Enter the queue. | Meet someone. | Start talking. | Leave anytime. |

</div>

---

## Architecture

SELAMCHAT uses a React and TypeScript frontend with an Express.js backend and Drizzle ORM for database operations.

```text
SELAMCHAT/
├── client/
│   └── src/              # React application
├── server/                # Backend services
├── api/                   # API integration
├── shared/                # Shared application code
├── drizzle/               # Database schema and migrations
├── patches/               # Project patches
├── .github/               # GitHub configuration
├── Dockerfile
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js
- npm
- Git

### Installation

```bash
git clone https://github.com/karadayiefe/SELAMCHAT.git

cd SELAMCHAT

npm install
```

### Development

```bash
npm run dev
```

*Available scripts and environment variables are defined in the project configuration.*

---

## Technology Stack

| Technology | Purpose |
|:--|:--|
| React | User interface |
| TypeScript | Application development |
| Express.js | Backend API |
| Drizzle ORM | Database operations |
| Vercel | Deployment |

---

## Privacy

Privacy is a core part of the SELAMCHAT experience.

- No account creation or personal profiles.
- Temporary identities for conversations.
- Messages are intended to exist only during active sessions.
- Messages are deleted from the database when either participant leaves.

---

## Project

**Live application:** [selamchat.fun](https://selamchat.fun)

**Source code:** [GitHub Repository](https://github.com/karadayiefe/SELAMCHAT)

**Issues and feedback:** [GitHub Issues](https://github.com/karadayiefe/SELAMCHAT/issues)

---

<div align="center">

## SELAMCHAT

**Less introduction. More conversation.**

[![Visit SELAMCHAT](https://img.shields.io/badge/OPEN_SELAMCHAT-7a4dff?style=for-the-badge&labelColor=0d0d10)](https://selamchat.fun)

<sub>Built for spontaneous connections.</sub>

</div>
