*This project has been created as part of the 42 curriculum by `mhoushma`, `bhocsak`, `cjuarez`, `oshcheho`, `pghajard`.*

# ft_transcendence

## Description
- 🔴 clearly presents the project, including its goal and a brief overview.
- 🔴 should also contain a clear name for the project and its key features.


## Instructions

The evaluated deployment is Docker. From the repository root:

```bash
make
```

Then open https://localhost and accept the self-signed certificate warning. Stop with `make down`. See `make help` for logs, status, and restart.

`make` prepares `.env` and runs `docker compose up --build -d`, or `docker-compose` if the v2 plugin is missing.

Prerequisites: `make`, Docker Engine, and Docker Compose on Ubuntu. Ports 80 and 443 must be free.

The three containers plus Postgres are `nginx` (public HTTPS), `frontend` (SPA), `backend` (Django/Daphne), and `db` (PostgreSQL). Daily coding uses `make db` then Vite/Daphne; eval uses `make`.

Architecture diagrams: [DOCKER.md](DOCKER.md). Commands, env, and troubleshooting: [DEVOPS.md](DEVOPS.md).

Local development without Docker is still supported (Python venv + `npm run dev`). See [backend/README.md](backend/README.md) and [frontend/DEV.md](frontend/DEV.md).


## Resources
🔴 listing classic references related to the topic (documentation, articles, tutorials, etc.), as well as a description of how AI was used — specifying for which tasks and which parts of the project.


## Additional sections
### Team Information:
  - 🔴 Assigned role(s): PO, PM, Tech Lead, Developers, etc.
  - 🔴 Brief description of their responsibilities.
### Project Management:
  - 🔴 How the team organized the work (task distribution, meetings, etc.).
  - 🔴 Tools used for project management (GitHub Issues, Trello, etc.).
  - 🔴 Communication channels used (Discord, Slack, etc.)
### Technical Stack:
  - 🔴 Frontend technologies and frameworks used.
  - 🔴 Backend technologies and frameworks used.
  - 🔴 Database system and why it was chosen.
  - 🔴 Any other significant technologies or libraries.
  - 🔴Justification for major technical choices.
### Database Schema:
  - 🔴 Visual representation or description of the database structure.
  - 🔴 Tables/collections and their relationships.
  - 🔴 Key fields and data types
### Features List:
  - 🔴 Complete list of implemented features.
  - 🔴 Which team member(s) worked on each feature.
  - 🔴 Brief description of each feature’s functionality.
### Modules:
  - 🔴 List of all chosen modules (Major and Minor).
  - 🔴 Point calculation (Major = 2pts, Minor = 1pt).
  - 🔴 Justification for each module choice, especially for custom "Modules of choice".
  - 🔴 How each module was implemented.
  - 🔴 Which team member(s) worked on each module.
### Individual Contributions:
  - 🔴 Detailed breakdown of what each team member contributed.
  - 🔴 Specific features, modules, or components implemented by each person.
  - 🔴 Any challenges faced and how they were overcome.

## Any other useful or relevant information is welcome (usage documentation, known limitations, license, credits, etc.).
