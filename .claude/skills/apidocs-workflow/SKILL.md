---
name: apidocs-workflow
description: Stage 2 of site-to-API: author workflows/<site>/<id>.json, the steps a person follows while the recorder attributes requests to them.
disable-model-invocation: true
---

# Authoring a workflow

A workflow is one user goal written as steps a person can follow in the browser. The recorder marks where each step begins and ends, so every request lands in a step and the docs can say "this endpoint is called when you open a job". The schema is `WorkflowSchema` in `src/apidocs/types.ts`; this is what matters when writing one.

## Shape

```json
{
  "workflowVersion": 1,
  "id": "open-job",
  "name": "Open a job",
  "goal": "From the jobs board, open one job and read its proposals tab.",
  "effect": "read",
  "preconditions": ["signed in", "at least one job exists"],
  "inputs": [],
  "steps": [
    { "id": "jobs-board", "do": "Open the Jobs page from the sidebar.", "expect": "network", "hints": ["/dashboard/team/{teamId}/jobs"] },
    { "id": "open-job", "do": "Click the first job card.", "expect": "url", "hints": ["/jobs/{jobId}"] },
    { "id": "proposals-tab", "do": "Open the Proposals tab inside the job.", "expect": "network" }
  ]
}
```

- `id` fields are slugs (`[a-z0-9-]`), unique within the file. The file is `workflows/<site>/<id>.json`.
- `do` is the instruction a person reads out loud. One action per step; a step with two clicks hides which one made the request.
- `expect`: `network` (the step must produce in-scope requests; zero is flagged on the page), `url` (the address changes), `ui` (something visible changes, no request needed).
- `hints` are URL fragments or endpoint names you expect; they help the reader of the docs, not the recorder.
- `inputs` declare values the person types (`kind` text, number, file, choice; `secret: true` redacts the value everywhere). A step lists the inputs it uses in `uses`, and derive then finds where that value appears in requests.
- `effect: "write"` needs `inverse` (the workflow that undoes it) and a non-production target. The hook refuses to record it otherwise. `confirms` names the confirmation buttons a write step presses, so the page can label them.
- A `login` workflow is the one place `verification` appears (`password`, `code`, `passkey`, `sso`). Its secret inputs are never shown; recording it is only useful on an account you control.

## Choosing workflows

Three to eight steps per workflow, one goal each. Start with the workflows a developer would ask for first: list the main entity, open one, read its sub-resources. The read-only tour (`/apidocs-record`) covers "open every navigation link" on its own and writes `readonly-tour.json`; hand-written workflows add depth where the tour cannot click.

On a production target every step is navigation: open, click into, switch tab, filter, page. `.claude/rules/production-safety.md` lists what is off the table.

## Done check

```
npx tsx -e "import('./src/apidocs/types.ts').then(m => { m.WorkflowSchema.parse(JSON.parse(require('fs').readFileSync('workflows/<site>/<id>.json','utf8'))); console.log('ok') })"
```

Prints `ok`. Then `/apidocs-record`.
