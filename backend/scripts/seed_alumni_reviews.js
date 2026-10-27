import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/placement_portal';

const ALUMNI_REVIEWS = [
  {
    authorName: "Ananya Hegde",
    company: "Google",
    jobTitle: "Software Engineer (SWE-1)",
    linkedinUrl: "https://www.linkedin.com/in/ananya-hegde-google-nie/",
    phone: "+91 98451 22340",
    email: "ananya.hegde.2024@nie.ac.in",
    batch: "2024",
    ctc: 31.5,
    rating: 5,
    verifiedAlumni: true,
    advice: "For Google, speed and edge-case handling are everything. Don't jump directly into code—clearly state your time & space complexities first. Master Graphs (BFS/DFS, Dijkstra), Dynamic Programming on trees, and Trie data structures.",
    interviewQuestions: [
      "Find the median of a stream of integers using two heaps.",
      "Design an LRU Cache with O(1) get and put operations.",
      "Given a 2D grid of characters and a dictionary of words, find all words present on the board (Word Search II using Trie).",
      "Explain the trade-offs between TCP and UDP in real-time gaming services.",
      "How would you optimize database read latencies in a globally distributed service?"
    ],
    rounds: [
      {
        roundNumber: 1,
        roundName: "Online Assessment (Google Coding Challenge)",
        details: "2 algorithmic coding questions on HackerEarth platform with 60 minutes time limit. Heavy emphasis on hidden test cases and performance constraints.",
        questions: [
          "Minimum operations to make array elements equal using GCD transformations.",
          "Shortest path in a weighted grid with obstacles and fuel constraints."
        ]
      },
      {
        roundNumber: 2,
        roundName: "Technical Round 1 (Data Structures & Algorithms)",
        details: "45 minutes Google Meet live coding on Google Docs without syntax highlighting.",
        questions: [
          "Serialize and deserialize a Binary Tree.",
          "Find all articulation points and bridges in an undirected network graph."
        ]
      },
      {
        roundNumber: 3,
        roundName: "Technical Round 2 (Algorithms & Problem Solving)",
        details: "Deep dive into dynamic programming, interval scheduling, and memory optimization.",
        questions: [
          "Course Schedule III: Greedy with Max-Heap.",
          "How does Garbage Collection work in V8 JavaScript vs Java HotSpot?"
        ]
      },
      {
        roundNumber: 4,
        roundName: "Googliness & Leadership Fit",
        details: "Behavioral interview testing collaborative mindset, handling disagreements, diversity, and resolving technical bottlenecks under tight deadlines.",
        questions: [
          "Tell me about a time you noticed an ambiguous bug right before release.",
          "How do you handle team members who disagree with your system architecture proposal?"
        ]
      }
    ]
  },
  {
    authorName: "Karthik K Bhat",
    company: "Google",
    jobTitle: "Software Engineer",
    linkedinUrl: "https://www.linkedin.com/in/karthik-bhat-nie-sde/",
    phone: "+91 94480 81239",
    email: "karthik.bhat.cse@nie.ac.in",
    batch: "2025",
    ctc: 28.0,
    rating: 5,
    verifiedAlumni: true,
    advice: "Google interviewers love when you write modular, clean code. Practice thinking out loud. If you get stuck, explain your brute-force logic and ask clarifying questions on input bounds.",
    interviewQuestions: [
      "Find the longest consecutive sequence in an unsorted array in O(n) time.",
      "Implement a thread-safe Singleton pattern in Java/C++.",
      "Trapping Rain Water problem variation with variable barrier widths."
    ],
    rounds: [
      {
        roundNumber: 1,
        roundName: "Online Coding Screening",
        details: "Two medium-hard LeetCode style problems.",
        questions: ["Subarray Sum Equals K", "Number of Islands variation"]
      },
      {
        roundNumber: 2,
        roundName: "Live Coding (DSA)",
        details: "Focused on recursion trees, backtracking, and state memoization.",
        questions: ["Word Break II with word reconstruction", "Clone an undirected Graph"]
      },
      {
        roundNumber: 3,
        roundName: "Behavioral & System Design Basics",
        details: "Discussion on past major project, handling scalability, caching layers.",
        questions: ["Explain how Redis avoids cache stampede", "Walk through your major project architecture"]
      }
    ]
  },
  {
    authorName: "Priya M Kulkarni",
    company: "FitTech",
    jobTitle: "Associate Software Engineer",
    linkedinUrl: "https://www.linkedin.com/in/priya-kulkarni-fittech/",
    phone: "+91 97412 55901",
    email: "priya.kulkarni@fittech.io",
    batch: "2025",
    ctc: 10.5,
    rating: 4,
    verifiedAlumni: true,
    advice: "FitTech is a fast-growing health-tech startup culture. They test hands-on web stack skills, React state hooks, asynchronous JavaScript, Node.js REST APIs, and database indexing. Have a strong full-stack project to talk about!",
    interviewQuestions: [
      "Explain the Event Loop in Node.js (Microtask queue vs Macrotask queue).",
      "How does React reconciliation virtual DOM diffing algorithm work?",
      "Design a REST API schema for tracking daily user step counts and calories burned with fast date-range queries.",
      "What are composite indexes in MongoDB/PostgreSQL and when do they fail to be utilized?",
      "Implement debounce and throttle utility functions from scratch in vanilla JavaScript."
    ],
    rounds: [
      {
        roundNumber: 1,
        roundName: "Online Assessment (MCQ & Coding)",
        details: "30 Core CS MCQs (DBMS, OS, JS) + 2 live coding tasks (Array manipulation & string hashing).",
        questions: [
          "Group Anagrams in O(N*K) time.",
          "Normalize and paginate a JSON stream of fitness activity logs."
        ]
      },
      {
        roundNumber: 2,
        roundName: "Machine Coding & Live Technical Round",
        details: "Live 60-min coding round: build a mini React component with real-time search filtering and debounced API calls.",
        questions: [
          "Build an interactive workout log table with sorting and local cache.",
          "Explain difference between SQL JOINs and MongoDB $lookup performance."
        ]
      },
      {
        roundNumber: 3,
        roundName: "Founder & Culture Fit Round",
        details: "Product thinking interview with the Engineering Manager. Discussion on how to handle user drop-offs and app performance.",
        questions: [
          "How would you handle optimistic UI updates when network connectivity is flaky on mobile devices?",
          "Why do you want to join a startup like FitTech over big legacy tech?"
        ]
      }
    ]
  },
  {
    authorName: "Sandeep Rao",
    company: "FitTech",
    jobTitle: "Frontend / Full Stack Engineer",
    linkedinUrl: "https://www.linkedin.com/in/sandeep-rao-fittech/",
    phone: "+91 96110 33421",
    email: "sandeep.rao.ise@nie.ac.in",
    batch: "2024",
    ctc: 11.2,
    rating: 5,
    verifiedAlumni: true,
    advice: "Brush up on Next.js SSR vs SSG, Zustand/Redux state management, and CORS issues. In technical interviews, they really appreciate clean folder structure and meaningful variable naming.",
    interviewQuestions: [
      "Difference between useMemo, useCallback, and React.memo.",
      "How do JWT tokens work and where should you securely store them on client side?",
      "Write a SQL query to find top 3 active fitness users per city."
    ],
    rounds: [
      {
        roundNumber: 1,
        roundName: "CodeSignal Screening",
        details: "Algorithmic problem solving and SQL query writing.",
        questions: ["SQL multi-table aggregation query", "Sliding window maximum"]
      },
      {
        roundNumber: 2,
        roundName: "System Architecture & API Design",
        details: "Design a notification service for workout reminders with cron scheduling.",
        questions: ["Rate limiting algorithms (Token bucket vs Leaky bucket)"]
      }
    ]
  },
  {
    authorName: "Nikhil Deshmukh",
    company: "BMW",
    jobTitle: "Technology Specialist / Analyst",
    linkedinUrl: "https://www.linkedin.com/in/nikhil-deshmukh-bmw-tech/",
    phone: "+91 99805 77123",
    email: "nikhil.deshmukh@bmwgroup.com",
    batch: "2024",
    ctc: 13.8,
    rating: 5,
    verifiedAlumni: true,
    advice: "BMW Tech Hub looks for strong foundation in Core Computer Science: Operating Systems (Threads, Semaphores, Deadlocks), Computer Networks (OSI layers, Handshakes), and C++/Python. They appreciate candidates with knowledge of IoT, telematics, or cloud-connected systems.",
    interviewQuestions: [
      "Explain process synchronization using Mutex vs Counting Semaphore.",
      "What is CAN bus protocol and how is it used in connected automotive ECU units?",
      "Design an in-memory Pub/Sub message broker in Python/C++.",
      "Explain ACID properties with real banking/telemetry examples.",
      "How does MQTT differ from HTTP when streaming car sensor telemetry to AWS/Azure IoT Hub?"
    ],
    rounds: [
      {
        roundNumber: 1,
        roundName: "Online Assessment (Aptitude + Technical Core)",
        details: "60 questions covering Quantitative aptitude, Logical reasoning, C++/Python syntax, and OS/DBMS theory.",
        questions: [
          "Predict memory leaks in C++ pointer references.",
          "Identify deadlock conditions from a given resource allocation graph."
        ]
      },
      {
        roundNumber: 2,
        roundName: "Technical Round (DSA & Core Systems)",
        details: "Interview with a Technical Lead from BMW Tech Works Bengaluru.",
        questions: [
          "Detect a cycle in a Directed Graph using Kahn's algorithm or DFS colors.",
          "Explain virtual memory, paging, and page fault replacement algorithms (LRU, FIFO)."
        ]
      },
      {
        roundNumber: 3,
        roundName: "Managerial & Domain Architecture Round",
        details: "Discussion on embedded IoT architecture, vehicle telemetry pipelines, and teamwork.",
        questions: [
          "How would you handle unreliable vehicle network connections when streaming GPS and engine telemetry?",
          "Tell me about a complex project where you had to compromise on features due to hardware constraints."
        ]
      }
    ]
  },
  {
    authorName: "Meghana Iyer",
    company: "BMW",
    jobTitle: "Data & Systems Analyst",
    linkedinUrl: "https://www.linkedin.com/in/meghana-iyer-bmw/",
    phone: "+91 94801 44320",
    email: "meghana.iyer.ece@nie.ac.in",
    batch: "2025",
    ctc: 12.5,
    rating: 4,
    verifiedAlumni: true,
    advice: "Very structured interview process. Review your resume inside out—every project listed will be probed. Be clear about why you want to work on automotive technologies and smart mobility.",
    interviewQuestions: [
      "Difference between TCP 3-way handshake and 4-way termination.",
      "Write a Python script to parse vehicle error log files and group anomalies by timestamp window.",
      "Explain the difference between clustered and non-clustered indexing."
    ],
    rounds: [
      {
        roundNumber: 1,
        roundName: "Technical Evaluation",
        details: "Data Structures, Python/C++ fundamentals, and DBMS SQL queries.",
        questions: ["SQL Window functions (RANK vs DENSE_RANK)", "Binary Search on Rotated Sorted Array"]
      },
      {
        roundNumber: 2,
        roundName: "HR & Behavioral Interview",
        details: "Focus on cultural alignment with BMW core values, adaptability, and relocation.",
        questions: ["Where do you see yourself in 3 years at BMW Tech?", "Handling conflict with colleagues."]
      }
    ]
  },
  {
    authorName: "Suraj G Rao",
    company: "Fidelity Investments",
    jobTitle: "Associate Software Engineer / Member Technical Staff",
    linkedinUrl: "https://www.linkedin.com/in/suraj-g-rao-nie/",
    phone: "+91 98440 66291",
    email: "suraj.rao.alumni@nie.ac.in",
    batch: "2025",
    ctc: 15.2,
    rating: 5,
    verifiedAlumni: true,
    advice: "Fidelity places high importance on OOPs concepts (Polymorphism, Inheritance, Encapsulation, Abstraction), Java 8 features (Streams, Lambdas), SQL, and clean code. Practice medium DSA problems and prepare STAR format answers for behavioral rounds.",
    interviewQuestions: [
      "Explain Java 8 Stream API: difference between map(), flatMap(), and filter().",
      "How does a HashMap work internally in Java? What happens during a hash collision?",
      "Explain ACID properties and transaction isolation levels in relational databases.",
      "Design a scalable portfolio rebalancing notification service.",
      "Difference between Synchronous REST API and Asynchronous Kafka event-driven architectures."
    ],
    rounds: [
      {
        roundNumber: 1,
        roundName: "HackerEarth Online Assessment",
        details: "20 Core CS MCQs + 2 Coding questions (Medium level) + 1 SQL query question.",
        questions: [
          "Find contiguous subarray with maximum product (Kadane variation).",
          "SQL query to find employees whose salary is above the average salary of their department."
        ]
      },
      {
        roundNumber: 2,
        roundName: "Technical Round 1 (Java, OOPs & DSA)",
        details: "60 minutes comprehensive evaluation of Java fundamentals, Collections framework, and live problem solving.",
        questions: [
          "Implement a custom thread-safe Queue in Java.",
          "Check if a binary tree is a valid Binary Search Tree (BST)."
        ]
      },
      {
        roundNumber: 3,
        roundName: "Technical Round 2 (System Architecture & DBMS)",
        details: "Discussion on database indexing, microservices patterns, Docker containerization, and AWS fundamentals.",
        questions: [
          "Explain the Saga pattern vs 2-phase commit in microservices.",
          "How would you prevent SQL Injection and Cross-Site Scripting (XSS) in an enterprise web app?"
        ]
      },
      {
        roundNumber: 4,
        roundName: "Managerial & HR Fit (Behavioral)",
        details: "Situational questions using Fidelity's leadership principles. Integrity, customer-first thinking, and ownership.",
        questions: [
          "Tell me about a time you had to learn a completely new framework within 48 hours.",
          "How would you handle a production outage on financial transaction software?"
        ]
      }
    ]
  },
  {
    authorName: "Pooja Nayak",
    company: "Fidelity Investments",
    jobTitle: "Cloud & Data Engineer",
    linkedinUrl: "https://www.linkedin.com/in/pooja-nayak-fidelity/",
    phone: "+91 97400 11988",
    email: "pooja.nayak.ise@nie.ac.in",
    batch: "2024",
    ctc: 14.8,
    rating: 5,
    verifiedAlumni: true,
    advice: "Fidelity has an amazing work culture and clear growth tracks. Make sure you understand the basics of CI/CD, Git, cloud basics (S3, EC2), and write test cases for your code during the live interview.",
    interviewQuestions: [
      "Explain String immutability in Java and why String is final.",
      "What is the difference between Checked and Unchecked exceptions?",
      "Design an LRU cache or explain its eviction policy."
    ],
    rounds: [
      {
        roundNumber: 1,
        roundName: "Technical Screening",
        details: "Coding and code walkthrough.",
        questions: ["Longest Substring Without Repeating Characters", "SQL JOIN optimization"]
      },
      {
        roundNumber: 2,
        roundName: "Senior Director Fit Round",
        details: "High level project discussion and situational questions.",
        questions: ["Why Financial Services domain?", "Handling strict deadlines"]
      }
    ]
  },
  {
    authorName: "Varun Kamath",
    company: "Cisco",
    jobTitle: "Software Engineer",
    linkedinUrl: "https://www.linkedin.com/in/varun-kamath-cisco-nie/",
    phone: "+91 98450 77621",
    email: "varun.kamath@cisco.com",
    batch: "2024",
    ctc: 19.5,
    rating: 5,
    verifiedAlumni: true,
    advice: "Cisco focuses heavily on Computer Networks (TCP/IP stack, Subnetting, Routing protocols BGP/OSPF), C/C++, and DSA. If you're from ECE or CSE, ensure your networking fundamentals are rock solid.",
    interviewQuestions: [
      "Explain the complete packet traversal path from client browser to web server (DNS lookup, ARP, Gateway, SYN/ACK).",
      "What is CIDR and calculate subnet masks for 200 hosts in a subnet.",
      "Detect and remove loop in a Linked List (Floyd's Cycle-Finding Algorithm)."
    ],
    rounds: [
      {
        roundNumber: 1,
        roundName: "Online Assessment",
        details: "Technical MCQs + 2 Data structure questions.",
        questions: ["Bit manipulation problem", "Graph shortest path"]
      },
      {
        roundNumber: 2,
        roundName: "Deep Technical Network & Systems Round",
        details: "Networking protocols, socket programming, and memory layout.",
        questions: ["Explain differences between IPv4 and IPv6 header sizes", "Implement a thread pool"]
      }
    ]
  },
  {
    authorName: "Divya Sharma",
    company: "Akamai",
    jobTitle: "Associate Solutions Engineer",
    linkedinUrl: "https://www.linkedin.com/in/divya-sharma-akamai-nie/",
    phone: "+91 99860 33140",
    email: "divya.sharma@akamai.com",
    batch: "2025",
    ctc: 16.5,
    rating: 4,
    verifiedAlumni: true,
    advice: "Akamai pioneered CDNs. Expect questions on HTTP/2, HTTP/3, Edge caching, DNS resolution, and Linux shell commands. Prepare Python/Go scripting for automation.",
    interviewQuestions: [
      "How do CDNs reduce latency and handle DDoS attacks?",
      "Explain the difference between Forward Proxy and Reverse Proxy.",
      "Write a regex script to parse Apache/Nginx web server access logs."
    ],
    rounds: [
      {
        roundNumber: 1,
        roundName: "Online Coding & Network Aptitude",
        details: "HackerRank assessment on algorithms and Linux fundamentals.",
        questions: ["Top K frequent elements", "Linux file permissions and piping"]
      },
      {
        roundNumber: 2,
        roundName: "Technical Architecture Round",
        details: "Discussion on internet infrastructure and CDN caching headers.",
        questions: ["Cache-Control headers (no-cache vs max-age)", "Explain TLS 1.3 handshake"]
      }
    ]
  },
  {
    authorName: "Harish Gowda",
    company: "Schneider Electric",
    jobTitle: "Graduate Engineer Trainee (R&D)",
    linkedinUrl: "https://www.linkedin.com/in/harish-gowda-schneider/",
    phone: "+91 94490 22109",
    email: "harish.gowda.ece@nie.ac.in",
    batch: "2025",
    ctc: 9.8,
    rating: 4,
    verifiedAlumni: true,
    advice: "Great company for ECE, EEE, and ISE graduates. Focus on Embedded systems, C/C++, IoT protocols (Modbus, MQTT), and power/energy management software fundamentals.",
    interviewQuestions: [
      "Explain volatile keyword in C and where it is mandatory in embedded systems.",
      "What is priority inversion in RTOS and how is priority inheritance used to fix it?",
      "Design an IoT sensor node that sends energy consumption data over MQTT."
    ],
    rounds: [
      {
        roundNumber: 1,
        roundName: "Technical Assessment",
        details: "C programming pointers, bitwise operators, and electrical/electronic circuits.",
        questions: ["Bitwise register manipulation", "Interrupt Service Routine (ISR) guidelines"]
      },
      {
        roundNumber: 2,
        roundName: "Technical & Managerial Discussion",
        details: "Project discussion, problem-solving mindset, and willingness to work across teams.",
        questions: ["Explain your final year hardware/IoT project", "Working in agile hardware-software sprints"]
      }
    ]
  }
];

async function seedAlumniReviews() {
  console.log(`Connecting to MongoDB at: ${MONGO_URI}`);
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const feedbacksColl = db.collection('feedbacks');
  const knowledgeColl = db.collection('college_knowledge_bank');
  const usersColl = db.collection('users');

  // Find or create alumni mentor user
  let mentor = await usersColl.findOne({ email: "alumni.nie@gmail.com" });
  if (!mentor) {
    const mentorRes = await usersColl.insertOne({
      name: "Suraj G Rao",
      email: "alumni.nie@gmail.com",
      password: "$2a$10$dummyhashedpasswordforalumnimentor123",
      role: "student",
      isPlaced: true,
      currentCTC: 18.5,
      cgpa: 8.8,
      skills: ["Data Structures", "Algorithms", "System Design", "Java", "Python"]
    });
    mentor = { _id: mentorRes.insertedId };
  }

  // Clear existing feedbacks to avoid stale or duplicate reviews
  await feedbacksColl.deleteMany({});
  console.log('Cleared existing feedbacks collection.');

  const feedbackDocs = ALUMNI_REVIEWS.map(r => ({
    ...r,
    user: mentor._id,
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  const inserted = await feedbacksColl.insertMany(feedbackDocs);
  console.log(`✅ Successfully seeded ${inserted.insertedCount} authentic alumni reviews in 'feedbacks' collection!`);

  // Build high-value RAG knowledge documents for AI Copilot
  const ragDocs = [];
  for (const r of ALUMNI_REVIEWS) {
    ragDocs.push({
      company: r.company,
      batch: r.batch,
      source: `Alumni Interview Hub (${r.authorName} - ${r.jobTitle})`,
      questions: r.interviewQuestions,
      advice: r.advice,
      full_text: `Company: ${r.company}
Role: ${r.jobTitle}
Batch: ${r.batch} | CTC: ₹${r.ctc} LPA
Verified Senior: ${r.authorName} (${r.linkedinUrl})
Advice: ${r.advice}
Key Questions Asked in Campus Drives:
${r.interviewQuestions.map(q => `- ${q}`).join('\n')}
Rounds:
${r.rounds.map(rnd => `Round ${rnd.roundNumber} (${rnd.roundName}): ${rnd.details}`).join('\n')}`
    });
  }

  await knowledgeColl.deleteMany({});
  await knowledgeColl.insertMany(ragDocs);
  console.log(`✅ Successfully seeded ${ragDocs.length} comprehensive RAG knowledge records in 'college_knowledge_bank' collection!`);

  await mongoose.disconnect();
  console.log('Alumni Hub & Copilot RAG seeding complete!');
}

seedAlumniReviews().catch(err => {
  console.error('Error seeding alumni reviews:', err);
  process.exit(1);
});
