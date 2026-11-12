# Team

| Person | GitHub | Role | Claude |
|---|---|---|---|
| Akash | akashjhajharia123-ui | [role] | Yes |
| [name] | ronakpooniaiitb | [role] | [yes/no] |
| [name] | Rahulchoudhary98 | [role] | [yes/no] |
| [name] | Kanishkkumar-Git | [role] | [yes/no] |

Roles: **A** core · **B** tests and review · **C** benchmark and dashboard · **D** pitch, demo, Discord (no Claude needed).
Details per role: `docs/STATUS.md`. Opening prompts: `docs/TEAM_PROMPTS.md`.

## Setup (once, about 10 minutes)

1. Accept the two GitHub invitations (stickyroute and bifrost) at https://github.com/notifications.
2. Install Git and Go 1.27.3+ (macOS: `brew install go`).
3. Then:

```bash
git clone https://github.com/akashjhajharia123-ui/stickyroute.git && cd stickyroute && bash setup.sh
```

4. Open Claude Code in the `stickyroute` folder and paste your role's prompt from `docs/TEAM_PROMPTS.md`.

## Every session

- Start: `git pull` in `stickyroute/` and in `stickyroute/bifrost/`.
- End: update your section of `docs/STATUS.md`, commit, push.
