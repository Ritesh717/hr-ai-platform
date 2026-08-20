# HR AI Agent Platform — Production-Grade Implementation Blueprint

## 1. Executive Summary

This project is a production-oriented HR platform designed specifically as a learning path for building AI agents inside a real application.

The goal is not to build a chatbot. The goal is to progressively build:

- Tool-using agents
- RAG agents
- Action-taking agents
- Stateful workflow agents
- Event-driven agents
- Analytics and text-to-SQL agents
- Multi-agent systems
- Human-in-the-loop workflows
- Observable, secure, evaluable production AI systems

The backend is **Python-first**.

### Recommended core stack

| Layer | Technology |
|---|---|
| Frontend | Next.js + TypeScript |
| Backend API | **Python + FastAPI** |
| Agent SDK | **OpenAI Agents SDK for Python** |
| Stateful agent graphs | LangGraph where graph/state semantics are useful |
| Durable workflows | Temporal + Python SDK |
| Database | PostgreSQL |
| Vector search | pgvector initially |
| Cache | Redis |
| Event streaming | Kafka / Redpanda |
| ORM | SQLAlchemy 2.x |
| Validation | Pydantic |
| Migrations | Alembic |
| Authentication | Keycloak / OIDC |
| Observability | OpenTelemetry |
| Metrics | Prometheus |
| Dashboards | Grafana |
| Logs | Loki or OpenSearch |
| Traces | Grafana Tempo or Jaeger |
| Testing | pytest + pytest-asyncio |
| Containers | Docker |
| Orchestration | Kubernetes |
| Infrastructure | Terraform |
| CI/CD | GitHub Actions + Argo CD |
| Secrets | Vault or cloud secret manager |
| Object storage | S3-compatible storage |
| API documentation | OpenAPI |
| Load testing | k6 |
| Security scanning | Trivy + Semgrep + dependency scanning |

---

# 2. Product Vision

Build an AI-powered HR Operating System.

```text
                         HR AI PLATFORM
                               |
        -------------------------------------------------
        |             |             |                  |
   Employee       Recruitment    HR Operations      Analytics
        |             |             |                  |
   Leave          Candidates      Payroll          SQL Agent
   Payroll        Interviews      Expense          Reports
   Policies       Onboarding      Documents        Insights
   Benefits       Scheduling      Compliance       Dashboards
```

The system should eventually allow an HR user or employee to interact with HR capabilities using natural language while maintaining strict authorization, auditability and human approval for sensitive actions.

---

# 3. Architectural Principles

## 3.1 API-first

Agents should not directly manipulate databases whenever possible.

Prefer:

```text
Agent
  ↓
Tool
  ↓
Domain Service
  ↓
Repository
  ↓
PostgreSQL
```

rather than:

```text
Agent
  ↓
Raw SQL
```

This gives you:

- Authorization
- Validation
- Auditability
- Testability
- Business-rule enforcement
- Consistent behavior between UI and agents

---

## 3.2 Agents are orchestrators, not business logic containers

An agent should decide:

> "Which tool should I use?"

The domain service should decide:

> "Is this operation actually allowed?"

Example:

```text
Employee Agent
      ↓
request_leave()
      ↓
LeaveService
      ↓
Authorization
      ↓
Policy validation
      ↓
Leave balance validation
      ↓
Create request
```

Never trust the LLM to enforce business rules.

---

## 3.3 Human-in-the-loop for high-impact operations

Actions involving:

- Hiring decisions
- Compensation
- Termination
- Payroll changes
- Sensitive employee data
- Access provisioning
- Compliance actions

should have appropriate human approval.

The agent should assist rather than become the final decision-maker.

---

# 4. Repository Architecture

Recommended monorepo:

```text
hr-ai-platform/
│
├── apps/
│   ├── api/
│   │   ├── main.py
│   │   ├── routers/
│   │   ├── dependencies/
│   │   └── middleware/
│   │
│   ├── agent_service/
│   │   ├── agents/
│   │   ├── tools/
│   │   ├── prompts/
│   │   └── policies/
│   │
│   ├── workflow_worker/
│   │   ├── workflows/
│   │   └── activities/
│   │
│   └── event_consumer/
│
├── domain/
│   ├── employee/
│   ├── leave/
│   ├── payroll/
│   ├── recruitment/
│   ├── expense/
│   ├── onboarding/
│   └── performance/
│
├── infrastructure/
│   ├── database/
│   ├── redis/
│   ├── kafka/
│   ├── temporal/
│   ├── storage/
│   └── observability/
│
├── shared/
│   ├── auth/
│   ├── errors/
│   ├── events/
│   ├── logging/
│   └── configuration/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── agent/
│   ├── workflow/
│   ├── security/
│   └── evaluation/
│
├── migrations/
├── docker/
├── helm/
├── terraform/
├── docs/
└── pyproject.toml
```

---

# 5. Phase 0 — Engineering Foundation

## Objective

Build the production foundation before introducing agents.

## Backend

Use:

- Python 3.12+
- FastAPI
- Pydantic v2
- SQLAlchemy 2.x
- Alembic
- PostgreSQL
- Redis
- pytest
- Ruff
- MyPy or Pyright

## Initial services

```text
FastAPI
   |
   +---- PostgreSQL
   |
   +---- Redis
   |
   +---- Object Storage
```

## Core modules

```text
Employee
Department
Organization
Role
Permission
Tenant
AuditLog
```

## API standards

Use:

```text
/api/v1/employees
/api/v1/departments
/api/v1/leave
/api/v1/recruitment
```

Every API should have:

- Request validation
- Response schemas
- Authentication
- Authorization
- Error handling
- Correlation/request ID
- OpenAPI documentation
- Audit logging where required

## Production baseline

Implement:

- Structured JSON logs
- Global exception handler
- Health endpoint
- Readiness endpoint
- Liveness endpoint
- Request IDs
- Database connection pooling
- Configuration management
- Secrets management
- Graceful shutdown
- API rate limiting

---

# 6. Phase 1 — Employee AI Assistant

## Objective

Build the first tool-using agent.

Employee asks:

> What is my remaining leave balance?

Agent:

```text
User
 ↓
FastAPI
 ↓
Employee Agent
 ↓
get_leave_balance()
 ↓
Leave Service
 ↓
PostgreSQL
 ↓
Agent
 ↓
Response
```

## Agent tools

```python
get_employee_profile()
get_leave_balance()
get_manager()
get_department()
get_payslip()
get_pending_requests()
```

## Technologies

- OpenAI Agents SDK for Python
- FastAPI
- Pydantic
- PostgreSQL
- SQLAlchemy
- OpenTelemetry

## Learning objectives

You learn:

- Agent creation
- Tool definitions
- Tool calling
- Structured output
- Context
- Authentication propagation
- Agent tracing
- Error handling

## Security rule

The agent must never receive unrestricted database access.

Instead:

```text
Agent → Tool → Service → Repository
```

---

# 7. Phase 2 — HR Policy RAG Agent

## Objective

Create an agent that understands company policies.

Documents:

```text
Leave Policy
WFH Policy
Travel Policy
Expense Policy
Benefits Policy
Performance Policy
Employee Handbook
Code of Conduct
```

## Architecture

```text
Document
 ↓
Parser
 ↓
Chunker
 ↓
Embedding
 ↓
pgvector
 ↓
Retriever
 ↓
Agent
 ↓
Answer + Sources
```

## Initial technology

Use PostgreSQL + pgvector rather than introducing a separate vector database immediately.

This keeps the platform simpler.

## Metadata

Every chunk should contain:

```text
tenant_id
document_id
document_type
version
effective_from
effective_to
department
access_level
created_at
```

## Retrieval security

Do not retrieve documents first and authorize later.

Prefer:

```text
User identity
 ↓
Authorization filter
 ↓
Vector search
 ↓
Relevant chunks
```

## Features

- Semantic search
- Keyword search
- Metadata filtering
- Source citations
- Document versioning
- Document access control

---

# 8. Phase 3 — Action-Taking Leave Agent

## Objective

Move from answering questions to executing workflows.

User:

> Apply leave from September 10 to September 15.

Agent workflow:

```text
Understand request
       ↓
Resolve dates
       ↓
Check holidays
       ↓
Check leave policy
       ↓
Check balance
       ↓
Create leave request
       ↓
Find manager
       ↓
Request approval
       ↓
Notify employee
```

## Tools

```python
check_leave_balance()
calculate_leave_days()
check_holidays()
validate_leave_policy()
create_leave_request()
get_manager()
send_notification()
```

## Important design

The agent should not be allowed to:

```text
UPDATE leave_requests ...
```

directly.

Instead:

```text
create_leave_request()
```

must invoke domain logic.

## Human approval

Depending on policy:

```text
Agent
 ↓
Create pending request
 ↓
Manager approval
 ↓
Workflow continues
```

---

# 9. Phase 4 — Expense and Document Agent

## Objective

Combine document understanding, policy reasoning and action execution.

Employee uploads:

```text
Hotel invoice
Flight ticket
Taxi receipt
Meal receipt
```

Agent:

```text
Upload
 ↓
Document extraction
 ↓
Classification
 ↓
Policy lookup
 ↓
Validation
 ↓
Calculate reimbursement
 ↓
Create expense claim
 ↓
Approval
```

## Technology

- S3-compatible object storage
- Document parsing/OCR
- PostgreSQL
- pgvector
- Python document-processing libraries
- OpenAI models for structured extraction where appropriate

## Extracted schema

```json
{
  "vendor": "...",
  "invoice_number": "...",
  "date": "...",
  "amount": 0,
  "currency": "...",
  "category": "...",
  "tax": 0
}
```

Use Pydantic validation before storing extracted data.

---

# 10. Phase 5 — Onboarding Workflow Agent

This is where durable workflows become important.

## Problem

Onboarding can take days or weeks.

Example:

```text
Employee created
 ↓
Create onboarding checklist
 ↓
Request laptop
 ↓
Request system access
 ↓
Assign training
 ↓
Schedule orientation
 ↓
Notify manager
 ↓
Wait for approvals
 ↓
Confirm completion
```

A normal HTTP request is the wrong abstraction.

## Introduce Temporal

```text
FastAPI
   ↓
Temporal
   ↓
Onboarding Workflow
   |
   +-- HR Activity
   +-- IT Activity
   +-- Notification Activity
   +-- Calendar Activity
```

## Why Temporal

You learn:

- Durable execution
- Retries
- Timeouts
- Signals
- Workflow state
- Long-running workflows
- Human approval
- Failure recovery

---

# 11. Phase 6 — Event-Driven HR Platform

Introduce Kafka or Redpanda.

## Events

```text
EmployeeCreated
EmployeeUpdated
LeaveRequested
LeaveApproved
LeaveRejected
ExpenseSubmitted
ExpenseApproved
CandidateCreated
InterviewScheduled
EmployeeOffboardingStarted
```

## Architecture

```text
HR Service
   ↓
Event
   ↓
Kafka / Redpanda
   ↓
Consumers
   ├── Notification
   ├── Analytics
   ├── Audit
   ├── Search indexing
   └── Agent workflows
```

## Event design

Events should be versioned.

Example:

```json
{
  "event_type": "EmployeeCreated",
  "event_version": 1,
  "event_id": "...",
  "tenant_id": "...",
  "occurred_at": "...",
  "actor_id": "...",
  "data": {}
}
```

---

# 12. Phase 7 — HR Analytics Agent

HR asks:

> Which department has the highest attrition?

Agent:

```text
Natural language
 ↓
Schema discovery
 ↓
SQL generation
 ↓
SQL validation
 ↓
Query execution
 ↓
Result analysis
 ↓
Response
```

## Architecture

```text
Analytics Agent
      ↓
Schema Tool
      ↓
SQL Generation
      ↓
SQL Validator
      ↓
Read-only DB
      ↓
Result
      ↓
Analysis
```

## Critical security

Use a separate read-only database role.

Never allow the analytics agent to execute:

```sql
INSERT
UPDATE
DELETE
DROP
ALTER
TRUNCATE
```

## Add SQL guardrails

Implement:

- Statement type validation
- Table allowlists
- Column allowlists
- Query timeout
- Row limits
- Cost controls
- Tenant filtering
- Sensitive-column protection

---

# 13. Phase 8 — Recruitment Agent

Modules:

```text
Job Description Agent
Candidate Search Agent
Resume Analysis Agent
Interview Agent
Interview Scheduling Agent
Candidate Communication Agent
```

## Recruitment workflow

```text
Job created
 ↓
JD Agent
 ↓
Candidate ingestion
 ↓
Resume extraction
 ↓
Candidate matching
 ↓
Recruiter review
 ↓
Interview scheduling
 ↓
Interview feedback
 ↓
Offer workflow
```

## Important safety principle

Do not allow the AI to autonomously make final employment decisions.

The system should provide:

- Evidence
- Structured summaries
- Rubrics
- Explanations
- Recommendations

with human decision-making.

---

# 14. Phase 9 — Supervisor / Multi-Agent Architecture

Now introduce a supervisor.

```text
                  Supervisor Agent
                         |
        -----------------+-----------------
        |                |                |
        ▼                ▼                ▼
 Employee Agent     HR Agent       Recruitment Agent
        |                |                |
        ▼                ▼                ▼
 Leave Agent       Policy Agent   Interview Agent
 Payroll Agent     Expense Agent Scheduling Agent
```

## Example

User:

> I am joining next Monday. What do I need to do?

Supervisor determines:

```text
Onboarding Agent
Employee Agent
Document Agent
IT Access Agent
Calendar Agent
Notification Agent
```

## Important principle

Do not create multi-agent architecture just because it sounds sophisticated.

Start with a single agent.

Introduce specialist agents when:

- Tools become numerous
- Context becomes domain-specific
- Different permissions are required
- Different workflows need isolation
- Evaluation needs to be separated

---

# 15. Phase 10 — HR Copilot

The final application becomes a unified HR copilot.

Example:

> "Prepare the monthly HR review."

Supervisor:

```text
Analytics Agent
 ↓
Headcount
Hiring
Attrition
Leave
Performance
Training
 ↓
Insight Agent
 ↓
Report Agent
 ↓
Human review
 ↓
Final report
```

---

# 16. Python Backend Architecture

## FastAPI

Use FastAPI for:

- REST APIs
- Agent invocation endpoints
- Authentication
- File upload
- Streaming responses
- Webhooks
- Health checks

Example:

```text
POST /api/v1/agent/chat
POST /api/v1/agent/tasks
POST /api/v1/documents
GET  /api/v1/employees/{id}
POST /api/v1/leave
```

## SQLAlchemy

Use SQLAlchemy 2.x with:

- Async sessions where useful
- Explicit repositories
- Transaction boundaries
- Connection pooling

## Pydantic

Use Pydantic for:

- API schemas
- Tool input schemas
- Agent structured outputs
- Event schemas
- Configuration

## Alembic

All database changes must be migrations.

---

# 17. Agent Service Architecture

Recommended separation:

```text
agents/
├── employee_agent.py
├── policy_agent.py
├── leave_agent.py
├── expense_agent.py
├── recruitment_agent.py
├── analytics_agent.py
└── supervisor_agent.py
```

Tools:

```text
tools/
├── employee/
├── leave/
├── payroll/
├── documents/
├── recruitment/
├── notifications/
└── analytics/
```

Prompts:

```text
prompts/
├── employee/
├── policy/
├── recruitment/
└── supervisor/
```

Keep prompts versioned like code.

---

# 18. Temporal Architecture

Use Temporal for:

- Employee onboarding
- Recruitment workflows
- Approval processes
- Offboarding
- Expense approval
- Long-running agent workflows
- Scheduled HR processes

Example:

```text
OnboardingWorkflow
    |
    +-- create_hr_tasks
    +-- request_it_access
    +-- request_equipment
    +-- schedule_orientation
    +-- wait_for_manager_approval
    +-- send_completion_notification
```

Activities should be:

- Idempotent
- Retryable
- Observable
- Small
- Explicit

---

# 19. Redis

Use Redis for:

- Short-lived cache
- Rate limiting
- Session-related data
- Distributed locks where appropriate
- Temporary state
- Frequently accessed reference data

Do not use Redis as the system of record.

---

# 20. PostgreSQL

PostgreSQL should be the primary transactional database.

Suggested domains:

```text
employees
departments
organizations
roles
permissions
leave_requests
leave_balances
expenses
payroll
documents
candidates
jobs
interviews
performance_reviews
audit_logs
agent_runs
approvals
```

## Multi-tenancy

For a SaaS-style HR application:

```text
tenant_id
```

should be present on tenant-owned records.

Consider PostgreSQL Row Level Security for strong tenant isolation.

---

# 21. Vector Search

Start with:

```text
PostgreSQL + pgvector
```

Move to a dedicated vector database only when scale or retrieval requirements justify it.

Store:

```text
embedding
document_id
chunk_id
tenant_id
access_policy
document_version
```

---

# 22. Authentication and Authorization

Use OIDC.

Possible identity provider:

- Keycloak
- Auth0
- Cloud identity provider

Architecture:

```text
User
 ↓
OIDC
 ↓
JWT
 ↓
FastAPI
 ↓
Authorization
 ↓
Domain Service
```

Implement:

- RBAC
- Tenant isolation
- Resource-level authorization
- Role-based tool access
- Audit logging

Example:

```text
Employee
 ├── Own profile
 ├── Own leave
 └── Own payslips

Manager
 ├── Team leave
 ├── Team performance
 └── Team information

HR Admin
 ├── Employee management
 ├── Recruitment
 └── HR reports
```

---

# 23. Agent Tool Authorization

Every tool should declare what permission it requires.

Example:

```text
get_employee_profile
→ employee.profile.read

create_leave_request
→ employee.leave.write

approve_leave
→ manager.leave.approve

view_payroll
→ payroll.read
```

The LLM should never decide whether a user is authorized.

The authorization layer decides.

---

# 24. Observability Architecture

Observability is a first-class requirement.

Use:

```text
OpenTelemetry
      |
      +------------------+
      |                  |
     Logs              Metrics
      |                  |
    Loki              Prometheus
      |                  |
      +--------+---------+
               |
             Grafana
               |
             Traces
               |
             Tempo
```

## Track every agent execution

Capture:

```text
trace_id
span_id
agent_name
agent_version
model
model_version
request_id
tenant_id
user_id
tool_name
tool_duration
tool_success
token_usage
latency
errors
guardrail_results
workflow_id
```

Do not put sensitive employee content into telemetry by default.

---

# 25. Agent Tracing

Example:

```text
HTTP Request
   |
   └── Agent Run
          |
          ├── LLM Call
          |
          ├── Tool: get_employee
          |
          ├── Tool: get_leave_balance
          |
          ├── LLM Call
          |
          └── Final Response
```

This allows you to answer:

- Why was the agent slow?
- Which tool failed?
- How many LLM calls occurred?
- How much did this request cost?
- Which agent version produced the result?

---

# 26. Metrics

Track application metrics:

```text
HTTP request latency
HTTP error rate
DB latency
Kafka lag
Temporal workflow failures
Redis latency
```

Track agent metrics:

```text
agent_success_rate
agent_failure_rate
agent_latency
tool_call_count
tool_failure_rate
llm_latency
tokens_input
tokens_output
estimated_cost
handoff_rate
human_approval_rate
guardrail_trigger_rate
```

Track RAG metrics:

```text
retrieval_latency
documents_retrieved
retrieval_relevance
citation_rate
no_answer_rate
```

---

# 27. SLOs

Define SLOs for important paths.

Example:

```text
API availability: 99.9%

Employee agent response:
p95 < 5 seconds

Simple tool call:
p95 < 1 second

Leave creation:
99.9% workflow completion

Critical workflow failure:
< 0.1%
```

These are initial engineering targets, not universal requirements.

---

# 28. Logging

Use structured JSON logs.

Example:

```json
{
  "timestamp": "...",
  "level": "INFO",
  "service": "agent-service",
  "trace_id": "...",
  "agent": "leave-agent",
  "tool": "get_leave_balance",
  "duration_ms": 120,
  "status": "success"
}
```

Never log:

- Passwords
- Access tokens
- Full payslips
- Sensitive personal data
- Unredacted HR documents

---

# 29. AI Evaluation

Traditional unit tests are not enough.

Create an evaluation framework.

```text
tests/
└── evaluation/
    ├── employee_agent/
    ├── policy_agent/
    ├── leave_agent/
    ├── analytics_agent/
    └── supervisor/
```

Evaluate:

### Correctness

Did the agent produce the correct answer?

### Tool selection

Did it select the right tool?

### Tool arguments

Were the arguments correct?

### Grounding

Did the answer use the correct policy?

### Safety

Did it refuse unauthorized actions?

### Hallucination

Did it invent information?

### Workflow correctness

Did it complete the required sequence?

---

# 30. Golden Dataset

Create a dataset of realistic HR questions.

Example:

```text
Question:
How many annual leaves do I have?

Expected tool:
get_leave_balance

Expected answer:
12

```

For policy:

```text
Question:
Can I work remotely from another country?

Expected source:
Remote Work Policy v3
```

Run this dataset after every agent/prompt/model change.

---

# 31. Prompt Management

Treat prompts as versioned artifacts.

```text
prompts/
├── employee/
│   ├── v1.txt
│   └── v2.txt
├── leave/
│   ├── v1.txt
│   └── v2.txt
└── supervisor/
    └── v1.txt
```

Record:

```text
agent_version
prompt_version
model
tool_versions
```

for every production run.

---

# 32. Guardrails

Implement guardrails at multiple layers.

```text
User Input
   ↓
Input Guardrails
   ↓
Agent
   ↓
Tool Authorization
   ↓
Tool Validation
   ↓
Output Guardrails
   ↓
Human Approval
```

Guard against:

- Prompt injection
- Unauthorized data access
- Excessive tool calls
- Dangerous actions
- Sensitive data leakage
- Unsupported claims
- Cross-tenant retrieval
- SQL injection
- Tool argument manipulation

---

# 33. Prompt Injection Protection

Treat retrieved documents and external content as untrusted data.

For example:

```text
HR Policy
    ↓
Retrieved text
    ↓
Agent context
```

The retrieved text must not be allowed to redefine system instructions.

Use clear separation:

```text
SYSTEM INSTRUCTIONS
USER REQUEST
UNTRUSTED DOCUMENT CONTENT
TOOL RESULTS
```

---

# 34. Human-in-the-Loop Architecture

Example:

```text
Agent
 ↓
Proposed Action
 ↓
Risk Classification
 ↓
 ┌───────────────┐
 │ Low Risk      │ → Execute
 └───────────────┘

 ┌───────────────┐
 │ High Risk     │ → Human Approval
 └───────────────┘
```

Examples of potentially high-risk actions:

- Payroll modifications
- Employment termination
- Compensation changes
- Access revocation
- Final hiring decisions

---

# 35. Audit Logging

Every sensitive agent action should create an audit record.

Example:

```text
actor_id
actor_type
tenant_id
action
resource_type
resource_id
agent_name
agent_version
tool_name
timestamp
approval_id
result
```

Example:

```text
Agent:
leave-agent-v3

Action:
create_leave_request

Employee:
12345

Approved by:
manager-789

Timestamp:
2026-08-18T10:22:31Z
```

---

# 36. Security Architecture

Implement:

- OIDC
- RBAC
- Resource authorization
- Tenant isolation
- PostgreSQL RLS where appropriate
- Encryption at rest
- TLS
- Secret management
- Audit logs
- Rate limiting
- Input validation
- Output validation
- Dependency scanning
- Container scanning
- SAST
- DAST
- Security headers

---

# 37. Data Classification

Classify HR data.

```text
PUBLIC
INTERNAL
CONFIDENTIAL
HIGHLY_SENSITIVE
```

Examples:

```text
Company policy → INTERNAL

Employee department → CONFIDENTIAL

Salary → HIGHLY_SENSITIVE

Bank information → HIGHLY_SENSITIVE
```

Use the classification to control:

- Retrieval
- Logging
- Agent context
- Tool access
- Data retention

---

# 38. CI/CD

Pipeline:

```text
Git Push
   ↓
Lint
   ↓
Type Check
   ↓
Unit Tests
   ↓
Integration Tests
   ↓
Agent Evaluations
   ↓
Security Scan
   ↓
Build Docker Image
   ↓
Container Scan
   ↓
Push Image
   ↓
Deploy
   ↓
Smoke Tests
```

Recommended tools:

```text
GitHub Actions
Ruff
Pytest
MyPy/Pyright
Trivy
Semgrep
k6
Argo CD
```

---

# 39. Docker

Each runtime component should have its own container.

```text
api
agent-service
temporal-worker
event-consumer
frontend
```

Avoid building one giant container containing every component.

---

# 40. Kubernetes

Production environment:

```text
Kubernetes
│
├── api
├── agent-service
├── temporal-worker
├── event-consumer
├── frontend
├── ingress
└── observability
```

Use:

- Deployments
- Services
- ConfigMaps
- Secrets
- Horizontal Pod Autoscaler
- PodDisruptionBudget
- NetworkPolicies
- Resource requests/limits
- Readiness probes
- Liveness probes

---

# 41. Infrastructure as Code

Use Terraform.

Manage:

```text
Kubernetes
PostgreSQL
Redis
Kafka
Object Storage
Networking
IAM
Secrets
Monitoring
```

Maintain:

```text
terraform/
├── environments/
│   ├── dev/
│   ├── staging/
│   └── prod/
└── modules/
```

---

# 42. Environment Strategy

Use:

```text
local
dev
staging
production
```

Each environment should have different:

- Credentials
- Databases
- Secrets
- LLM configuration
- Observability
- Data

Never use production employee data for development.

---

# 43. Disaster Recovery

Plan for:

```text
Database failure
Redis failure
Kafka failure
Temporal failure
LLM provider outage
Agent service failure
Kubernetes failure
```

Implement:

- PostgreSQL backups
- Point-in-time recovery
- Object storage versioning
- Multi-zone deployment where justified
- Retry policies
- Circuit breakers
- Dead-letter queues
- Workflow recovery
- Provider fallback strategy where appropriate

---

# 44. Cost Engineering

Track cost per:

```text
Agent run
User
Tenant
Workflow
Tool
Model
```

Example:

```text
Employee Agent
Average tokens
Average latency
Average cost/request
```

Use:

- Model routing
- Caching
- Context reduction
- Retrieval optimization
- Prompt optimization
- Token limits
- Tool result truncation

---

# 45. Production Agent Lifecycle

Every agent should have:

```text
Development
   ↓
Evaluation
   ↓
Staging
   ↓
Canary
   ↓
Production
   ↓
Monitoring
   ↓
Evaluation
   ↓
Improvement
```

Never treat prompt/model changes as harmless configuration changes.

A prompt change can change application behavior.

---

# 46. Recommended Development Sequence

## Stage 1

Build:

```text
FastAPI
PostgreSQL
SQLAlchemy
Alembic
Authentication
Employee CRUD
```

## Stage 2

Add:

```text
Employee Agent
Tool Calling
Tracing
```

## Stage 3

Add:

```text
RAG
pgvector
Policy Agent
```

## Stage 4

Add:

```text
Leave Agent
Human Approval
Audit Logs
```

## Stage 5

Add:

```text
Expense Agent
Document Processing
```

## Stage 6

Add:

```text
Temporal
Onboarding Workflow
```

## Stage 7

Add:

```text
Kafka / Redpanda
Event-driven architecture
```

## Stage 8

Add:

```text
Analytics Agent
Text-to-SQL
Visualization
```

## Stage 9

Add:

```text
Recruitment Agent
Interview Agent
Scheduling Agent
```

## Stage 10

Add:

```text
Supervisor
Multi-agent architecture
```

## Stage 11

Production hardening:

```text
Security
Observability
Evaluation
Load testing
Disaster recovery
Cost optimization
```

---

# 47. Suggested Milestone Architecture

## Milestone 1

```text
Next.js
   ↓
FastAPI
   ↓
PostgreSQL
```

Goal:

Build a normal HR application.

---

## Milestone 2

```text
Next.js
   ↓
FastAPI
   ↓
Employee Agent
   ↓
HR Tools
   ↓
PostgreSQL
```

Goal:

Build your first real tool-using agent.

---

## Milestone 3

```text
Employee Agent
      |
      +-- HR API
      +-- Policy RAG
      +-- PostgreSQL
      +-- Redis
```

Goal:

Combine tools and knowledge.

---

## Milestone 4

```text
Agent
 ↓
Temporal
 ↓
Workflow
 ↓
Human Approval
```

Goal:

Build durable agent workflows.

---

## Milestone 5

```text
                    Supervisor
                        |
       -----------------+----------------
       |                |               |
   Employee          HR Agent       Analytics
       |                |               |
     Leave           Expense         SQL Agent
```

Goal:

Build multi-agent orchestration.

---

# 48. Production Technology Map

```text
                    ┌───────────────────────┐
                    │       Next.js         │
                    └───────────┬───────────┘
                                │
                         REST / SSE
                                │
                    ┌───────────▼───────────┐
                    │       FastAPI         │
                    └───────────┬───────────┘
                                │
              ┌─────────────────┼──────────────────┐
              │                 │                  │
              ▼                 ▼                  ▼
       Agent Service       Domain Services      Workflows
              │                 │                  │
              │                 │              Temporal
              │                 │                  │
              └────────┬────────┘                  │
                       ▼                           │
                  PostgreSQL ◄─────────────────────┘
                       │
                    pgvector

          ┌─────────────────────────────────┐
          │          Infrastructure         │
          ├─────────────────────────────────┤
          │ Redis                           │
          │ Kafka / Redpanda                │
          │ S3                              │
          │ Kubernetes                      │
          └─────────────────────────────────┘

          ┌─────────────────────────────────┐
          │         Observability           │
          ├─────────────────────────────────┤
          │ OpenTelemetry                   │
          │ Prometheus                      │
          │ Grafana                         │
          │ Loki / OpenSearch               │
          │ Tempo / Jaeger                  │
          └─────────────────────────────────┘
```

---

# 49. What You Will Learn

By completing the project you will have practical experience with:

### Backend engineering

- Python
- FastAPI
- Async programming
- SQLAlchemy
- PostgreSQL
- Redis
- Kafka
- API design
- Authentication
- Authorization

### AI engineering

- LLM APIs
- Tool calling
- Structured outputs
- RAG
- Embeddings
- Agent memory
- Agent orchestration
- Multi-agent systems
- Guardrails
- Human-in-the-loop
- Evaluation

### Distributed systems

- Event-driven architecture
- Temporal
- Kafka
- Retries
- Idempotency
- Distributed workflows
- Failure recovery

### Production engineering

- Docker
- Kubernetes
- Terraform
- CI/CD
- OpenTelemetry
- Prometheus
- Grafana
- Distributed tracing
- Security
- Load testing
- Disaster recovery

---

# 50. Definition of Done

The project should not be considered production-ready merely because the agent produces good answers.

A production-ready phase should satisfy:

```text
[ ] API tests
[ ] Unit tests
[ ] Integration tests
[ ] Agent evaluation tests
[ ] Authorization tests
[ ] Security tests
[ ] Structured logging
[ ] Distributed tracing
[ ] Metrics
[ ] Alerts
[ ] Audit logging
[ ] Error handling
[ ] Retry strategy
[ ] Idempotency
[ ] Rate limiting
[ ] Secrets management
[ ] Docker image
[ ] CI/CD
[ ] Documentation
[ ] Runbook
[ ] Rollback strategy
```

For agent-specific features:

```text
[ ] Tool permissions defined
[ ] Prompt versioned
[ ] Model version recorded
[ ] Tool inputs validated
[ ] Tool outputs validated
[ ] Guardrails configured
[ ] Evaluation dataset exists
[ ] Failure cases documented
[ ] Cost tracked
[ ] Latency tracked
[ ] Human approval defined where required
```

---

# 51. Final Recommended Stack

If the objective is to learn production-grade AI agent engineering while building the HR application, use this stack as the default:

```text
Frontend
────────
Next.js
TypeScript

Backend
───────
Python
FastAPI
Pydantic
SQLAlchemy
Alembic

AI
──
OpenAI Agents SDK for Python
LangGraph where explicit graph/state orchestration is useful
OpenAI models
RAG
pgvector

Workflow
────────
Temporal Python SDK

Data
────
PostgreSQL
Redis
S3-compatible object storage

Messaging
─────────
Kafka / Redpanda

Security
────────
OIDC
Keycloak or managed identity provider
RBAC
PostgreSQL RLS
Vault / cloud secrets

Observability
─────────────
OpenTelemetry
Prometheus
Grafana
Loki/OpenSearch
Tempo/Jaeger

Testing
───────
pytest
pytest-asyncio
integration tests
agent evaluations
k6

DevOps
──────
Docker
Kubernetes
Helm
Terraform
GitHub Actions
Argo CD

Security tooling
─────────────────
Trivy
Semgrep
Dependency scanning
SAST/DAST
```

---

# 52. Recommended First Implementation

Do **not** start by installing Kubernetes, Kafka, Temporal and 15 infrastructure components on day one.

Start here:

```text
Next.js
   │
   ▼
FastAPI
   │
   ├── PostgreSQL
   │
   └── Employee Agent
          │
          ├── get_employee()
          ├── get_leave_balance()
          ├── get_manager()
          └── get_payslip()
```

Then add **OpenTelemetry from the beginning**.

After the first agent works:

```text
Agent
 ↓
RAG
 ↓
Actions
 ↓
Temporal
 ↓
Events
 ↓
Analytics
 ↓
Recruitment
 ↓
Multi-Agent
 ↓
Kubernetes
```

This gives you a much better learning curve than trying to build the final distributed architecture immediately.

---

# 53. End State

The final system should look conceptually like:

```text
                         HR AI COPILOT
                              │
                              ▼
                       SUPERVISOR AGENT
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
   EMPLOYEE AGENT       HR OPERATIONS       RECRUITMENT
          │                   │                   │
     ┌────┼────┐         ┌────┼────┐        ┌────┼────┐
     ▼    ▼    ▼         ▼    ▼    ▼        ▼    ▼    ▼
   Leave Payroll Policy Expense Docs Analytics JD Interview
                              │
                              ▼
                         TOOL LAYER
                              │
              ┌───────────────┼────────────────┐
              ▼               ▼                ▼
          HR Services      Data Services    External APIs
              │               │                │
              └───────────────┼────────────────┘
                              ▼
                         PostgreSQL
                         pgvector
                         Redis
                         Kafka
                         S3
                              │
                              ▼
                         Temporal
                              │
                              ▼
                       WORKFLOW ENGINE

              ┌─────────────────────────────────┐
              │          OBSERVABILITY           │
              │ OpenTelemetry → Grafana Stack   │
              │ Metrics • Logs • Traces • Costs │
              └─────────────────────────────────┘

              ┌─────────────────────────────────┐
              │            SECURITY             │
              │ OIDC • RBAC • RLS • Audit      │
              │ Guardrails • Secrets • Policy   │
              └─────────────────────────────────┘

              ┌─────────────────────────────────┐
              │          EVALUATION             │
              │ Golden Sets • Agent Tests       │
              │ Regression • Safety • Quality   │
              └─────────────────────────────────┘
```

The key objective is to make this **one continuous project**, where every phase introduces a new agent-engineering concept while preserving the same production-quality platform underneath.

# 54. Appendix: Node.js/MongoDB Backend (`apps/api`)

Everything in §1–53 above describes the stack this project was **originally staged around**:
FastAPI, PostgreSQL, SQLAlchemy, Alembic, pgvector. That implementation's app code now lives at
`apps/deprecated/api/`, kept as a frozen reference snapshot — but its supporting Python packages
(`domain/`, `infrastructure/`, `shared/`), `migrations/`, `tests/`, `pyproject.toml`/
`poetry.lock`, the Python `Dockerfile`, and the `.venv` have all been **deleted**, since nothing
else in the repo depended on them once the Node backend was verified working. `apps/deprecated/
api/` cannot be imported, run, or tested anymore; §1–53's prose still describes the design
accurately as a historical record, but the code itself is not runnable and is not being
developed further.

`apps/api/` (NestJS + Mongoose + MongoDB) started as a parallel port of Stage 1's scope only
(§5/§46 Stage 1's employee/department/RBAC/audit-log/auth surface) and was then promoted to the
active backend. Whether Stage 2+ (agent tool-calling, RAG/pgvector, Temporal, Kafka, text-to-SQL)
targets this stack or gets re-planned for it is **not yet decided** — §1–53's Python/Postgres-
specific mechanics (SQLAlchemy sessions, Alembic migrations, pgvector, the Python Agents SDK)
have not been translated, only Stage 1's scope has. Track status in [`plan.md`](../plan.md)'s
backend-implementations section.

## Design deltas from the PostgreSQL design (§20–22, §36)

- **Multi-tenancy**: §20's suggestion to use PostgreSQL Row-Level Security has no MongoDB
  equivalent. The Node port relies entirely on the same explicit, application-layer discipline
  the Python side already uses in practice (every repository method takes and filters on
  `tenantId`) — there was no RLS in the Python implementation as of Stage 1 either (deferred to
  Stage 11 hardening per plan.md), so this delta is smaller than it looks.
- **Migrations**: no Alembic equivalent. Mongoose schemas are enforced at the application layer,
  not the database's; `apps/api/scripts/sync-indexes.ts` is the closest analogue to "run
  migrations" — it explicitly (re)builds every unique index declared in the Mongoose schemas at
  deploy time.
- **RBAC storage**: §22 describes Role/Permission/RolePermission as three tables (Permission
  global, Role tenant-scoped, joined by role_permissions). The Mongo port embeds
  `permissions: PermissionCode[]` directly on the `Role` document — Mongo doesn't need the SQL
  join-table pattern, and the global permission catalog is served straight from the
  `PermissionCode` TypeScript enum (no DB read), since Permission rows never carried
  tenant-specific data in the Python design either (`description` was always null).
- **Transactions**: §16's "explicit repositories, transaction boundaries" becomes
  `connection.transaction()` (Mongoose sessions) wrapping the same multi-collection writes that
  shared a Postgres transaction via `get_db()` — specifically `TenantService.bootstrap` (tenant +
  3 roles + HR admin) and `EmployeeService`'s create/update/delete (document write + audit log
  entry). This requires MongoDB to run as a replica set even for local development (see
  `docker-compose.yml`'s `mongo` + `mongo-rs-init` services) — a single standalone `mongod`
  cannot run multi-document transactions.
- **Vector search (§21)**: not applicable — the Node port only covers Stage 1's scope, which
  predates the Policy RAG agent (Stage 3).

Everything else — the permission model itself (7 fixed `PermissionCode`s, 3 default role
templates, the RBAC_MANAGE self-lockout guardrail, the role-in-use delete guardrail), the JWT
auth model (permissions always resolved fresh from the DB per request, never trusted from the
token), the employee self-service field-level authorization split, and the structured
error/logging contracts — is a direct behavioral port, not a reinterpretation.

## 54. Agent runtime decision (Stage 2, story #1)

§6's "Technologies" list (OpenAI Agents SDK for Python) doesn't apply to `apps/api`
(NestJS/Mongoose). This section records the decision made when Stage 2 actually started.

**Chosen: Vercel AI SDK (`ai` + `@ai-sdk/anthropic` + `@ai-sdk/openai` + `@ai-sdk/deepseek`),
hand-rolled around it in `apps/api/src/modules/agent/`.** `AGENT_MODEL_PROVIDER` selects between
three provider options (`anthropic`, `openai`, `deepseek`) — DeepSeek's chat completions API is
OpenAI-compatible, and the official `@ai-sdk/deepseek` package (pinned to the same
`@ai-sdk/provider`/`@ai-sdk/provider-utils` versions already used by the anthropic/openai
providers) wraps it behind the same `LanguageModel` interface, so it needed no bespoke request
plumbing — just another `case` in `model/agent-model.provider.ts`'s provider switch and another
optional `DEEPSEEK_API_KEY` env var.

Options considered:

- **Vercel AI SDK** (chosen) — first-class TypeScript types, a `generateText({ model, tools,
  stopWhen })` loop that already implements the multi-step tool-calling round trip (model → tool
  call → tool result → model, repeated until a stop condition), a `tool()` helper that pairs a Zod
  input schema with an `execute()` function, and swappable model providers (`@ai-sdk/anthropic`,
  `@ai-sdk/openai`, more later) behind one `LanguageModel` interface — so the provider is an env
  var, not a rewrite. It also ships `ai/test`'s `MockLanguageModelV*` test doubles, which is what
  makes the agent's tool-calling loop unit-testable without a real API key or network call (see
  `employee-agent.service.spec.ts`).
- **Hand-rolled loop directly on the Anthropic/OpenAI SDKs** — rejected: would mean re-implementing
  the same multi-step tool-call loop, JSON-schema-from-Zod conversion, and streaming plumbing the
  AI SDK already provides, for no architectural benefit at this stage.
- **LangChain.js** — rejected for now: heavier abstraction (chains/agents/memory) than a single
  tool-calling agent needs per CLAUDE.md rule 7 ("don't reach for multi-agent architecture early");
  revisit only if/when Stage 10's supervisor work needs graph/state semantics LangChain.js's
  LangGraph offers that a hand-rolled orchestrator doesn't.

Design choices this implies for `apps/api/src/modules/agent/`:

- **The agent never touches Mongo.** `EmployeeAgentService.chat()` calls `generateText()` with a
  tool set built from `AgentToolDefinition[]` (`tools/agent-tool.ts`) — each definition's
  `handler` is expected to call a domain service (`EmployeeService`, `LeaveService`, ...), never a
  repository or Mongoose model directly (CLAUDE.md rule 1).
- **The authorization layer, not the LLM, decides.** `buildToolSet()` wraps every tool's
  `execute()` with a `requirePermission(context.actorPermissions, def.requiredPermission)` check
  before the tool's own handler runs — in exactly one place, so no individual tool author can skip
  it (CLAUDE.md rule 3).
- **Model construction is lazy, not DI-eager.** `model/agent-model.provider.ts`'s
  `resolveAgentModel()` is a plain function of `AgentModelConfig`, called fresh inside
  `chat()` — not memoized behind a NestJS provider constructed at module-init time. This lets the
  whole app boot (every non-agent route keeps working) with no model API key configured; a missing
  key surfaces loudly, at the first `chat()` call, instead of crashing the process at startup.
- **Prompts are versioned files.** `prompts/employee-agent/v1.md`, loaded and cached by
  `EmployeeAgentPromptService` (`AGENT_PROMPT_VERSION` env var selects the version); a prompt
  change is a new version file plus an env bump, never an edit to a shipped version's content
  (CLAUDE.md rule 8, blueprint §31).
- **`apps/agent_service/`** (an empty `agents/`, `tools/`, `policies/`, `prompts/` scaffold from
  the initial monorepo layout) is **not used** — agent code lives inside `apps/api/src/modules/
  agent/` per CLAUDE.md's instruction to hand-build new `apps/api` modules following the existing
  Controller → Service → Repository shape, one module among the others rather than a separate
  service. `apps/agent_service/` is dead scaffold; a later stage may repurpose or remove it.
