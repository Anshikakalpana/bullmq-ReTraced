# Job Scheduler Project Structure

distributed-job-scheduler/
│
├── .github/
│   └── workflows/
│       └── test.yml                    # CI/CD pipeline configuration



## api


├── api/                                # API Service (Job Management)
│   ├── src/
│   │   ├── common/                     # [Transitioning to shared package]
│   │   ├── job/
│   │   │   └── job.services.ts ✅        # Job creation & management logic
│   │   ├── routes/
│   │   │   └── job.route.ts   ✅         # Express routes for job APIs
│   │   ├── utils/
│   │   │   └── redis.ts   ✅             # Redis client for API service
│   │   └── index.ts   ✅                 # API entry point
│   ├── Dockerfile   ✅                   # Container configuration for API
│   ├── package.json    ✅                # API dependencies
│   ├── package-lock.json✅
│   └── tsconfig.json     ✅              # TypeScript config for API




## worker
├── worker/                             # Worker Service (Job Processing)
│   ├── src/
│   │   ├── common/                     # [Transitioning to shared package]
│   │   ├── delay-jobs/
│   │   │   └── delay-job.ts  ✅          # Scheduled/delayed job handling
│   │   ├── dlq/                        # Dead Letter Queue subsystem
│   │   │   ├── dlq.producer.ts ✅        # Moves failed jobs to DLQ
│   │   │   ├── dlq.retry.ts            # DLQ retry logic
│   │   │   ├── dlq.types.ts     ✅       # DLQ type definitions
│   │   │   ├── dlq.worker.ts           # DLQ processing worker
│   │   │   └── processDLQJob.ts ✅       # DLQ job execution handler
│   │   ├── handlers/                   # Job-specific handlers
│   │   │   ├── email.handler.ts  ✅      # Email job handler
│   │   │   └── fakeHandler.ts     ✅     # Test/mock handler
│   │   ├── manualTry/
│   │   │   └── retryJobManually.ts   ✅  # Manual retry trigger
│   │   ├── queue/                      # Queue management operations
│   │   │   ├── ack.ts          ✅        # Job acknowledgement system
│   │   │   ├── removeFromProcessing.ts ✅ # Remove job from processing queue
│   │   │   └── visibilityTimeout.ts   ✅ # Visibility timeout mechanism
│   │   ├── retry/
│   │   │   └── retry.ts     ✅           # Retry strategy implementation
│   │   ├── scripts/
│   │   │   └── pushTestJobs.ts  ✅       # Utility to seed test jobs
│   │   ├── utils/
│   │   │   └── redis.ts        ✅        # Redis client for Worker service
│   │   ├── index.ts          ✅          # Worker exports
│   │   └── worker.main.ts    ✅          # Worker entry point
│   ├── tests/
│   │   └── retry.test.ts     ✅          # Unit tests for retry logic
│   ├── Dockerfile         ✅             # Container configuration for Worker
│   ├── jest.config.mjs     ✅            # Jest testing configuration
│   ├── package.json          ✅          # Worker dependencies
│   ├── package-lock.json✅
│   ├── tsconfig.json          ✅         # TypeScript config
│   └── tsconfig.build.json    ✅         # Build-specific TS config



## shared
├── shared/                             # Shared Package (Common Code)
│   ├── common/
│   │   ├── failures/                   # Error handling
│   │   │   ├── error.type.ts     ✅      # Custom error types
│   │   │   └── jobErrorCodes.ts    ✅    # Job-specific error codes
│   │   ├── job.type.ts           ✅      # Job type definitions
│   │   └── queue.constants.ts     ✅     # Queue names and constants
│   ├── package.json                    # Shared package metadata
│   ├── package-lock.json
│   └── tsconfig.json                   # TypeScript config for shared



## docs
├── docs/                               # Documentation
│   ├── structure.md          ✅          # This file - project structure
│   └── todo.md                ✅         # Development roadmap & TODOs



├── .gitignore             ✅             # Git ignore rules
├── README.md               ✅            # Project README
└── docker-compose.yml      ✅            # Multi-container orchestration