import { upsertAgent } from '../services/agentService';

const AGENTS = [
  {
    name: 'AutoGPT',
    slug: 'autogpt',
    resource_type: 'agent',
    type: 'agent',
    description: 'An autonomous AI agent that chains together thoughts and executes tasks. Self-directed, self-correcting.',
    long_description: `AutoGPT is an experimental open-source application showcasing the capabilities of modern Large Language Models. It chains together LLM "thoughts" to autonomously achieve whatever goal you set. As one of the first examples of GPT-4 running fully autonomously, AutoGPT pushes the boundaries of what is possible with AI.

Set goals, and AutoGPT breaks them down into tasks, executes them one by one, and presents results. It has internet access for searches and information gathering, short-term and long-term memory management, file storage and summarization with GPT-3.5, and plugin extensibility.

Ideal for power users, developers, and researchers exploring autonomous AI agents.

⚠️ This is an experimental project. Human oversight is recommended during operation.`,
    author_github: 'Significant-Gravitas',
    repository_url: 'https://github.com/Significant-Gravitas/AutoGPT',
    homepage_url: 'https://news.agpt.co',
    license: 'MIT',
    tier1_category: 'agents',
    tier1_subcategory: 'autonomous',
    tier2_categories: ['autonomous', 'automation'],
    use_cases: ['automation', 'research', 'creative'],
    complexity_level: 'advanced',
    deployment_type: 'self-hosted',
    required_skills: ['openai', 'pinecone', 'docker'],
    external_dependencies: ['python>=3.8', 'docker', 'openai>=1.0'],
    tags: ['autonomous', 'gpt4', 'agent', 'python', 'docker'],
    tools_used: ['openai', 'pinecone', 'docker', 'google-search', 'gcs'],
    verification_checks: { has_repository: true, has_readme: true, has_tests: true, has_license: true, has_contributing: true, active_repo: true, has_releases: true, has_discussions: true },
    verification_score: 0.97,
    stars: 162000,
    forks: 44000,
    watchers: 3200,
  },
  {
    name: 'CrewAI',
    slug: 'crewai',
    resource_type: 'agent',
    type: 'agent',
    description: 'Framework for orchestrating role-playing, autonomous AI agents. Create teams of agents that work together.',
    long_description: `CrewAI is a cutting-edge framework for orchestrating role-playing, autonomous AI agents. By fostering collaborative intelligence, CrewAI empowers agents to work together seamlessly, tackling complex tasks as a unified team.

Each agent has a role, goal, and backstory. Crews coordinate agents to execute workflows, with built-in task delegation, delegation, and async execution support. Think of it as a multi-agent system where AI agents play specific roles — researcher, writer, reviewer — and collaborate to produce better outcomes than any single agent could achieve.

Perfect for building complex AI systems that require multiple specialized agents working in concert.`,
    author_github: 'joaomdmoura',
    repository_url: 'https://github.com/joaomdmoura/crewAI',
    homepage_url: 'https://www.crewai.com',
    license: 'MIT',
    tier1_category: 'agents',
    tier1_subcategory: 'multi-agent',
    tier2_categories: ['orchestration', 'multi-agent'],
    use_cases: ['automation', 'enterprise', 'research'],
    complexity_level: 'intermediate',
    deployment_type: 'self-hosted',
    required_skills: ['crewai', 'openai', 'langchain'],
    external_dependencies: ['python>=3.10', 'crewai', 'openai'],
    tags: ['multi-agent', 'crew', 'orchestration', 'python'],
    tools_used: ['openai', 'crewai', 'langchain', 'anthropic'],
    verification_checks: { has_repository: true, has_readme: true, has_tests: true, has_license: true, has_contributing: true, active_repo: true, has_releases: true, has_discussions: false },
    verification_score: 0.88,
    stars: 22500,
    forks: 3200,
    watchers: 480,
  },
  {
    name: 'LangGraph Multi-Agent State Machine',
    slug: 'langgraph-multi-agent',
    resource_type: 'workflow',
    type: 'workflow',
    description: 'Build stateful, multi-actor applications with LLMs. Cycle and branching support for complex agent flows.',
    long_description: `LangGraph is a library for building stateful, multi-actor applications with LLMs. It lets you create complex agent topologies using composable primitives — nodes for agents/tasks and edges for control flow.

Unlike linear chains (like LangChain Expression Language), LangGraph supports cycles, branching, and conditional logic, making it ideal for agent workflows that need to loop, retry, delegate, and make decisions based on intermediate results.

Key features include:
• Graph-based agent workflows with cycle support
• Built-in checkpointing for state persistence
• Human-in-the-loop intervention points
• Streaming responses for real-time feedback

Created by the LangChain team for building sophisticated multi-agent systems.`,
    author_github: 'langchain-ai',
    repository_url: 'https://github.com/langchain-ai/langgraph',
    homepage_url: 'https://langchain-ai.github.io/langgraph',
    license: 'MIT',
    tier1_category: 'workflows',
    tier1_subcategory: 'state-machine',
    tier2_categories: ['state-machine', 'multi-agent'],
    use_cases: ['automation', 'code', 'enterprise'],
    complexity_level: 'advanced',
    deployment_type: 'self-hosted',
    required_skills: ['langgraph', 'langchain', 'python'],
    external_dependencies: ['python>=3.9', 'langgraph', 'langchain-core'],
    tags: ['langgraph', 'multi-agent', 'state', 'python', 'graph'],
    tools_used: ['langgraph', 'openai', 'tavily', 'redis'],
    verification_checks: { has_repository: true, has_readme: true, has_tests: true, has_license: true, has_contributing: true, active_repo: true, has_releases: true, has_discussions: true },
    verification_score: 0.95,
    stars: 9200,
    forks: 1100,
    watchers: 90,
  },
  {
    name: 'Haystack RAG Pipeline',
    slug: 'haystack-document-pipeline',
    resource_type: 'workflow',
    type: 'workflow',
    description: 'NLP pipelines for semantic search and LLM workflows. Build retrieval-augmented generation chains.',
    long_description: `Haystack is an open-source framework for building search systems that work. It lets you construct modular pipelines for retrieval-augmented generation (RAG), semantic search, question answering, and document processing.

Haystack connects your custom LLM prompts with file converters, web search, and document stores. You can create multi-stage pipelines where documents are split into chunks, embedded, indexed, retrieved, and fed to an LLM for generation.

Features:
• Modular pipeline components (converters, pre-processors, retrievers, generators)
• Support for multiple retrieval methods (BM25, dense embeddings, hybrid)
• Multiple vector database backends (Elasticsearch, Weaviate, Pinecone, Qdrant)
• Built-in evaluation and benchmarking

Ideal for teams building production RAG systems and semantic search applications.`,
    author_github: 'deepset-ai',
    repository_url: 'https://github.com/deepset-ai/haystack',
    homepage_url: 'https://haystack.deepset.ai',
    license: 'Apache-2.0',
    tier1_category: 'workflows',
    tier1_subcategory: 'rag',
    tier2_categories: ['rag', 'search'],
    use_cases: ['research', 'automation', 'enterprise'],
    complexity_level: 'intermediate',
    deployment_type: 'self-hosted',
    required_skills: ['haystack', 'embeddings', 'retrieval'],
    external_dependencies: ['python>=3.8', 'haystack-ai'],
    tags: ['haystack', 'rag', 'search', 'python', 'nlp'],
    tools_used: ['elasticsearch', 'openai', 'transformers', 'sentence-transformers'],
    verification_checks: { has_repository: true, has_readme: true, has_tests: true, has_license: true, has_contributing: true, active_repo: true, has_releases: true, has_discussions: true },
    verification_score: 0.94,
    stars: 15200,
    forks: 2800,
    watchers: 200,
  },
  {
    name: 'ChromaDB Memory',
    slug: 'chromadb-memory',
    resource_type: 'memory',
    type: 'memory',
    description: 'Embedding database for AI agent memory. Store and retrieve vector embeddings for agent context.',
    long_description: `Chroma is the open-source AI application database. It makes it easy to build LLM apps by keeping your data and their embeddings close at hand.

Think of Chroma as the memory system for your AI agents — it stores knowledge, facts, and context as vector embeddings, then retrieves the most relevant pieces when your agent needs them. It's designed from the ground up for developer ergonomics and works well as both a local database and a cloud service.

Key capabilities:
• Store and query text embeddings, images, and other data types
• Built-in open-source embedding functions
• Simple Python and TypeScript APIs
• Persistent storage with SQLite
• Cloud-ready with Docker and Kubernetes support

The go-to choice for adding long-term memory and context recall to AI agents.`,
    author_github: 'chroma-core',
    repository_url: 'https://github.com/chroma-core/chroma',
    homepage_url: 'https://www.trychroma.com',
    license: 'Apache-2.0',
    tier1_category: 'memory',
    tier1_subcategory: 'vector',
    tier2_categories: ['vector', 'search'],
    use_cases: ['research', 'code', 'enterprise'],
    complexity_level: 'beginner',
    deployment_type: 'self-hosted',
    required_skills: ['chroma', 'embeddings', 'python'],
    external_dependencies: ['chromadb', 'python>=3.8'],
    tags: ['vector-db', 'embeddings', 'memory', 'python'],
    tools_used: ['openai', 'numpy', 'sqlite', 'duckdb'],
    verification_checks: { has_repository: true, has_readme: true, has_tests: true, has_license: true, has_contributing: false, active_repo: true, has_releases: true, has_discussions: true },
    verification_score: 0.75,
    stars: 14100,
    forks: 1700,
    watchers: 160,
  },
  {
    name: 'LlamaIndex Query Router',
    slug: 'llamaindex-agent-router',
    resource_type: 'router',
    type: 'router',
    description: 'Intelligent query routing across multiple data sources. Auto-generates queries based on user intent.',
    long_description: `LlamaIndex is a data framework for LLM applications to ingest, structure, and access private or domain-specific data. It connects your LLMs to your data sources — documents, APIs, SQL databases, and more — through a unified interface for querying.

The Query Router is a key component that intelligently decides which data source or query strategy to use based on the user's question. It can route queries to different indexes, apply different retrieval strategies, or combine results from multiple sources.

Features:
• Connect LLMs to custom data sources (PDFs, Notion, SQL, APIs)
• Multiple indexing and retrieval strategies
• Query routing and composition across data sources
• Integration with popular LLM frameworks
• Agent-based query refinement and self-correction

Essential for building data-aware applications where the LLM needs to ground responses in specific knowledge bases.`,
    author_github: 'run-llama',
    repository_url: 'https://github.com/run-llama/llama_index',
    homepage_url: 'https://www.llamaindex.ai',
    license: 'MIT',
    tier1_category: 'routers',
    tier1_subcategory: 'query',
    tier2_categories: ['query', 'routing'],
    use_cases: ['research', 'data', 'enterprise'],
    complexity_level: 'intermediate',
    deployment_type: 'api',
    required_skills: ['llamaindex', 'embeddings', 'python'],
    external_dependencies: ['llama-index', 'python>=3.8'],
    tags: ['llamaindex', 'routing', 'queries', 'rag', 'python'],
    tools_used: ['openai', 'pinecone', 'notion', 'postgres'],
    verification_checks: { has_repository: true, has_readme: true, has_tests: true, has_license: true, has_contributing: true, active_repo: true, has_releases: true, has_discussions: true },
    verification_score: 0.94,
    stars: 31500,
    forks: 5200,
    watchers: 480,
  },
  {
    name: 'Qdrant Vector Store',
    slug: 'qdrant-vector-store',
    resource_type: 'memory',
    type: 'memory',
    description: 'High-performance vector similarity search engine. Perfect for AI agent long-term memory.',
    long_description: `Qdrant is a vector similarity search engine and vector database written in Rust. It provides production-ready services with a convenient API for storing, searching, and managing points (vectors) with an additional payload.

For AI agents, Qdrant serves as the long-term memory system — agents store knowledge as vector embeddings and retrieve contextually relevant information when needed. It supports filtering by metadata, hybrid search, and distributed deployment.

Key features:
• High-performance vector search written in Rust
• Rich filtering with payload metadata
• Distributed deployment with horizontal scaling
• REST and gRPC APIs
• Built-in quantization for memory-efficient storage

A more performant and feature-rich alternative to basic vector databases, designed for production workloads.`,
    author_github: 'qdrant',
    repository_url: 'https://github.com/qdrant/qdrant',
    homepage_url: 'https://qdrant.tech',
    license: 'Apache-2.0',
    tier1_category: 'memory',
    tier1_subcategory: 'vector',
    tier2_categories: ['vector', 'search'],
    use_cases: ['research', 'enterprise', 'code'],
    complexity_level: 'intermediate',
    deployment_type: 'api',
    required_skills: ['qdrant', 'embeddings', 'rust'],
    external_dependencies: ['qdrant-client', 'python>=3.8'],
    tags: ['vector-db', 'search', 'rust', 'performance'],
    tools_used: ['openai', 'qdrant', 'python', 'grpc'],
    verification_checks: { has_repository: true, has_readme: true, has_tests: true, has_license: true, has_contributing: true, active_repo: true, has_releases: true, has_discussions: true },
    verification_score: 0.94,
    stars: 20100,
    forks: 2200,
    watchers: 160,
  },
  {
    name: 'Semantic Kernel SDK',
    slug: 'microsoft-semantic-kernel',
    resource_type: 'tool',
    type: 'tool',
    description: 'Microsoft SDK that integrates LLMs with conventional programming languages. Plugin architecture for AI.',
    long_description: `Semantic Kernel is an open-source SDK that integrates Large Language Models (LLMs) with conventional programming languages like C#, Python, and Java. It provides a plugin architecture that lets you define and compose AI skills — reusable units of functionality that combine natural language processing with code execution.

Unlike simple prompt-based integrations, Semantic Kernel enables planners — AI-powered components that can automatically chain together multiple plugins and skills to accomplish complex goals. It supports multiple LLM providers (OpenAI, Azure OpenAI, Hugging Face) out of the box.

Key features:
• AI-native plugins and skills architecture
• Planner for automatic task decomposition
• Memory integration for persistent AI context
• Multi-provider LLM support (OpenAI, Azure, HF)
• Native integration with Microsoft Copilot and Azure

Built by Microsoft for enterprise-grade AI application development.`,
    author_github: 'microsoft',
    repository_url: 'https://github.com/microsoft/semantic-kernel',
    homepage_url: 'https://learn.microsoft.com/semantic-kernel',
    license: 'MIT',
    tier1_category: 'tools',
    tier1_subcategory: 'sdk',
    tier2_categories: ['sdk', 'integration'],
    use_cases: ['enterprise', 'automation', 'code'],
    complexity_level: 'intermediate',
    deployment_type: 'api',
    required_skills: ['semantic-kernel', 'dotnet', 'openai'],
    external_dependencies: ['Microsoft.SemanticKernel', 'dotnet>=7.0'],
    tags: ['microsoft', 'sdk', 'kernel', 'dotnet', 'enterprise'],
    tools_used: ['openai', 'azure', 'dotnet', 'bings'],
    verification_checks: { has_repository: true, has_readme: true, has_tests: true, has_license: true, has_contributing: true, active_repo: true, has_releases: true, has_discussions: true },
    verification_score: 0.94,
    stars: 19800,
    forks: 4100,
    watchers: 320,
  },
  {
    name: 'HuggingFace Transformers Skill',
    slug: 'huggingface-transformers-skill',
    resource_type: 'skill',
    type: 'skill',
    description: 'Integrate Hugging Face models into Hermes agents. Text generation, embeddings, classification.',
    long_description: `The Hugging Face Transformers library provides thousands of pretrained models for natural language processing, computer vision, audio, and multimodal tasks. This skill enables Hermes agents to leverage these models for text generation, embeddings, classification, translation, summarization, and more.

With over 200,000 models available through the Hugging Face Hub, agents can perform tasks like sentiment analysis, named entity recognition, question answering, text generation, image classification, and audio transcription — all accessible through a unified pipeline API.

Key capabilities:
• Access 200,000+ pretrained models
• Text generation, classification, translation, summarization
• Embedding models for semantic search
• Image, audio, and video processing
• Fine-tuning support with PEFT and LoRA

The most comprehensive ML model library for AI agents.`,
    author_github: 'huggingface',
    repository_url: 'https://github.com/huggingface/transformers',
    homepage_url: 'https://huggingface.co/transformers',
    license: 'Apache-2.0',
    tier1_category: 'skills',
    tier1_subcategory: 'nlp',
    tier2_categories: ['nlp', 'ml'],
    use_cases: ['ml', 'research', 'code'],
    complexity_level: 'intermediate',
    deployment_type: 'self-hosted',
    required_skills: ['transformers', 'pytorch', 'python'],
    external_dependencies: ['transformers', 'torch', 'python>=3.9'],
    tags: ['huggingface', 'transformers', 'models', 'ml'],
    tools_used: ['pytorch', 'transformers', 'datasets', 'accelerate'],
    verification_checks: { has_repository: true, has_readme: true, has_tests: true, has_license: true, has_contributing: true, active_repo: true, has_releases: true, has_discussions: true },
    verification_score: 0.94,
    stars: 130000,
    forks: 27000,
    watchers: 2200,
  },
  {
    name: 'Pydantic AI Agent Framework',
    slug: 'pydantic-ai',
    resource_type: 'agent',
    type: 'agent',
    description: 'Type-safe Python AI agent framework with structured output and validated responses.',
    long_description: `Pydantic AI is a Python agent framework designed to make it easy to build production-grade applications with Generative AI. Built by the Pydantic team (creators of Pydantic v2), it brings type safety, validation, and structured output to AI agent development.

Unlike other agent frameworks that rely on loosely-typed prompt engineering, Pydantic AI uses Python type hints and Pydantic models to ensure agents produce valid, structured responses. It supports dependency injection, model-agnostic backends, and multi-turn conversations with state management.

Key features:
• Type-safe agent definitions with Python type hints
• Pydantic model validation for structured outputs
• Model-agnostic (OpenAI, Anthropic, Google, Groq, Mistral)
• Dependency injection for external tools and services
• Built-in conversation state management
• Streaming responses with type safety

Perfect for teams building type-safe, production-ready AI agents.`,
    author_github: 'pydantic',
    repository_url: 'https://github.com/pydantic/pydantic-ai',
    homepage_url: 'https://ai.pydantic.dev',
    license: 'MIT',
    tier1_category: 'agents',
    tier1_subcategory: 'structured',
    tier2_categories: ['structured', 'validation'],
    use_cases: ['code', 'automation', 'enterprise'],
    complexity_level: 'intermediate',
    deployment_type: 'self-hosted',
    required_skills: ['pydantic', 'python', 'openai'],
    external_dependencies: ['pydantic-ai', 'pydantic>=2.0', 'python>=3.9'],
    tags: ['pydantic', 'validation', 'types', 'python'],
    tools_used: ['openai', 'pydantic', 'httpx', 'anthropic'],
    verification_checks: { has_repository: true, has_readme: true, has_tests: true, has_license: true, has_contributing: true, active_repo: true, has_releases: true, has_discussions: false },
    verification_score: 0.88,
    stars: 8400,
    forks: 720,
    watchers: 85,
  },
  {
    name: 'OpenInterpreter Code Agent',
    slug: 'open-interpreter',
    resource_type: 'agent',
    type: 'agent',
    description: 'Let language models run code locally. Execute shell commands, manipulate files, browse the web.',
    long_description: `Open Interpreter lets LLMs run code (Python, JavaScript, Shell, etc.) on your computer to accomplish tasks. It brings the power of code execution to conversational AI — you can ask it to create a chart, browse the web, edit a file, or control an application.

It provides a ChatGPT-like interface in the terminal, but with the crucial ability to execute code. This means it can actually do things — create and edit files, run scripts, use system commands, and interact with the operating system.

⚠️ Requires human confirmation before code execution by default. Safe mode available.

Key capabilities:
• Code execution in multiple languages (Python, JS, Shell)
• Web browsing and screenshot capabilities
• File system operations (create, edit, read, delete)
• System command execution
• Integration with OpenAI, Local models (Llama 3, Ollama)
• Interactive or automated modes

Bridging the gap between chat and action — turning AI conversations into real results.`,
    author_github: 'OpenInterpreter',
    repository_url: 'https://github.com/OpenInterpreter/open-interpreter',
    homepage_url: 'https://openinterpreter.com',
    license: 'MIT',
    tier1_category: 'agents',
    tier1_subcategory: 'code-execution',
    tier2_categories: ['code-execution', 'terminal'],
    use_cases: ['automation', 'code', 'data'],
    complexity_level: 'beginner',
    deployment_type: 'self-hosted',
    required_skills: ['python', 'openai', 'shell'],
    external_dependencies: ['open-interpreter', 'python>=3.10'],
    tags: ['interpreter', 'code-exec', 'terminal', 'python'],
    tools_used: ['openai', 'python', 'shell', 'browserbase'],
    verification_checks: { has_repository: true, has_readme: true, has_tests: false, has_license: true, has_contributing: true, active_repo: true, has_releases: true, has_discussions: true },
    verification_score: 0.75,
    stars: 52000,
    forks: 6800,
    watchers: 800,
  },
  {
    name: 'LangChain Agent Builder',
    slug: 'langchain-agent-builder',
    resource_type: 'agent',
    type: 'agent',
    description: 'Build and deploy AI agents with LangChain. Supports multi-step reasoning and tool use.',
    long_description: `LangChain is the most popular framework for building applications powered by Large Language Models. It provides composable tools, abstractions, and integrations for constructing LLM-powered agents that can reason, use tools, manage memory, and chain together complex multi-step workflows.

Rather than a single "agent," LangChain provides the building blocks for creating custom agents — you define the tools they can use, the memory they maintain, the reasoning strategies they employ, and how they interact with external systems.

Key components:
• Chains: Sequences of calls to LLMs or other utilities
• Agents: Dynamic chains that use LLMs to decide which tools to call
• Tools: Utilities agents can use (search, calculator, file operations)
• Memory: Short-term and long-term conversation memory
• Retrieval: Document loading, splitting, embedding, and querying
• Callbacks: Logging and streaming for observability

The Swiss Army knife of LLM application development — flexible, comprehensive, and battle-tested.`,
    author_github: 'langchain-ai',
    repository_url: 'https://github.com/langchain-ai/langchain',
    homepage_url: 'https://python.langchain.com',
    license: 'MIT',
    tier1_category: 'agents',
    tier1_subcategory: 'chain',
    tier2_categories: ['chain', 'tool-using'],
    use_cases: ['automation', 'research'],
    complexity_level: 'intermediate',
    deployment_type: 'self-hosted',
    required_skills: ['langchain', 'openai', 'python'],
    external_dependencies: ['langchain', 'langchain-core', 'python>=3.9'],
    tags: ['langchain', 'agents', 'llm', 'python'],
    tools_used: ['openai', 'tavily', 'python', 'faiss'],
    verification_checks: { has_repository: true, has_readme: true, has_tests: true, has_license: true, has_contributing: true, active_repo: true, has_releases: true, has_discussions: true },
    verification_score: 0.94,
    stars: 92000,
    forks: 14000,
    watchers: 1800,
  },
];

async function seed() {
  console.log('🌱 Seeding Hermes Eco database with 12 real AI agents...\n');

  let inserted = 0;
  let skipped = 0;

  for (const agent of AGENTS) {
    try {
      await upsertAgent(agent);
      console.log(`  ✅ ${agent.name} (${agent.resource_type}) — verification: ${(agent.verification_score * 100).toFixed(0)}% — ${agent.stars.toLocaleString()} stars`);
      inserted++;
    } catch (err: any) {
      if (err.message?.includes('duplicate') || err.message?.includes('UNIQUE') || err.message?.includes('unique')) {
        console.log(`  ⏭️  ${agent.name} — already exists, skipping`);
        skipped++;
      } else {
        console.error(`  ❌ ${agent.name} — ${err.message}`);
      }
    }
  }

  console.log(`\n📊 Total: ${inserted} inserted, ${skipped} skipped`);
}

seed().then(() => process.exit(0)).catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
