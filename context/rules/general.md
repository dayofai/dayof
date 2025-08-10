# General Requirements

- Everything persisted to a single Postgres database
- Zero to minimal caching. At most in request caching for easy performance wins that don't require cache management.
- Updates must propogate in near real-time and we can't afford to worry about caching right now.
- Rules must sync via PowerSync (or something similar) where we slice off a part of the orgs database for use in offline-first mobile apps that use SQLite.
- We need to support decisions across the visibility, purchaseability, access, and pricing domains.
- We need to keep domain / business logic separate from the rule conditions.
- Domains need to be modular, extensible, and own their operators, facts, and functions (questions as I've called them in some places).
- We need to be able to call a domain function (question) from something like TanStack Start Server Functions or oRPC and to get a typed result back.
- Full and complete traces are extremely important. We must, by default, keep track of each step that happens from calling a domain function (question) all the way through the rules that were found, their evaluation (both success and failure), and any domain specific logic that happens. e.g. We should get, by default, a full and complete trace of *how and why* a decision was made.
- Facts are extremely important to the police / rules system but **and** to the broader application. The fact service should allow for the registration (via composition in code) of facts that tell us about the observed state of the "world". Facts can be core to the system or can be specific to a domain (and as such defined in the domains folder).
- Operators come the same system and domain flavors and allow us to make usefule comparisons between special types like Money, event time ranges, tickets, etc.
- Effect-TS should be leveraged as much as possible to ensure that the mental model is *clear* and the system is *robust*.
- Speaking of mental model... IT' REALLY IMPORTANT! A developer should be able to read through a few page markdown file and fully understand how things compose and function!!!
