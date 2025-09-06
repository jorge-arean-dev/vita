/**
 * Skill Registry Module
 * Centralized skill hierarchies, aliases, and relationships for Software Engineering
 */ /**
 * Software Engineering Skill Registry
 * Defines relationships, hierarchies, and aliases for technical skills
 */ export const SOFTWARE_SKILLS_REGISTRY = [
  // Programming Languages
  {
    skill: 'Python',
    children: [
      'Django',
      'Flask',
      'FastAPI',
      'Pandas',
      'NumPy',
      'Scikit-learn',
      'TensorFlow',
      'PyTorch'
    ],
    aliases: [
      'Python3',
      'Python 3',
      'py',
      'Python 2.7',
      'Python 3.x'
    ],
    qualifiesFor: [
      'Backend Development',
      'Data Science',
      'Machine Learning',
      'Scripting',
      'Automation'
    ]
  },
  {
    skill: 'JavaScript',
    children: [
      'React',
      'Vue',
      'Angular',
      'Node.js',
      'Express',
      'Next.js',
      'TypeScript',
      'jQuery'
    ],
    aliases: [
      'JS',
      'ECMAScript',
      'ES6',
      'ES2015',
      'Javascript'
    ],
    qualifiesFor: [
      'Frontend Development',
      'Backend Development',
      'Full Stack Development'
    ]
  },
  {
    skill: 'Java',
    children: [
      'Spring',
      'Spring Boot',
      'Hibernate',
      'JPA',
      'Maven',
      'Gradle'
    ],
    aliases: [
      'Java SE',
      'Java EE',
      'Jakarta EE',
      'J2EE'
    ],
    qualifiesFor: [
      'Backend Development',
      'Enterprise Development',
      'Android Development'
    ]
  },
  {
    skill: 'TypeScript',
    parent: [
      'JavaScript'
    ],
    aliases: [
      'TS',
      'typescript',
      'Type Script'
    ],
    requires: [
      'JavaScript'
    ],
    qualifiesFor: [
      'Frontend Development',
      'Backend Development',
      'Type-safe Development'
    ]
  },
  // Python Frameworks
  {
    skill: 'Django',
    parent: [
      'Python',
      'Web Development',
      'Backend Development'
    ],
    requires: [
      'Python'
    ],
    aliases: [
      'Django REST Framework',
      'DRF',
      'Django REST'
    ],
    qualifiesFor: [
      'Backend Development',
      'API Development',
      'Web Development'
    ]
  },
  {
    skill: 'Flask',
    parent: [
      'Python',
      'Web Development'
    ],
    requires: [
      'Python'
    ],
    aliases: [
      'Flask-RESTful',
      'Flask API'
    ],
    qualifiesFor: [
      'Backend Development',
      'API Development',
      'Microservices'
    ]
  },
  {
    skill: 'FastAPI',
    parent: [
      'Python',
      'Web Development'
    ],
    requires: [
      'Python'
    ],
    aliases: [
      'Fast API',
      'fast-api'
    ],
    qualifiesFor: [
      'Backend Development',
      'API Development',
      'Async Programming'
    ]
  },
  // JavaScript Frameworks
  {
    skill: 'React',
    parent: [
      'JavaScript',
      'Frontend Development'
    ],
    requires: [
      'JavaScript',
      'HTML',
      'CSS'
    ],
    children: [
      'Next.js',
      'Gatsby',
      'React Native'
    ],
    aliases: [
      'ReactJS',
      'React.js',
      'React JS'
    ],
    qualifiesFor: [
      'Frontend Development',
      'SPA Development',
      'UI Development'
    ]
  },
  {
    skill: 'Vue',
    parent: [
      'JavaScript',
      'Frontend Development'
    ],
    requires: [
      'JavaScript',
      'HTML',
      'CSS'
    ],
    children: [
      'Nuxt.js'
    ],
    aliases: [
      'VueJS',
      'Vue.js',
      'Vue 3',
      'Vue 2'
    ],
    qualifiesFor: [
      'Frontend Development',
      'SPA Development',
      'UI Development'
    ]
  },
  {
    skill: 'Angular',
    parent: [
      'TypeScript',
      'Frontend Development'
    ],
    requires: [
      'TypeScript',
      'JavaScript',
      'HTML',
      'CSS'
    ],
    aliases: [
      'AngularJS',
      'Angular 2+',
      'Angular.js'
    ],
    qualifiesFor: [
      'Frontend Development',
      'SPA Development',
      'Enterprise Frontend'
    ]
  },
  {
    skill: 'Node.js',
    parent: [
      'JavaScript',
      'Backend Development'
    ],
    children: [
      'Express',
      'NestJS',
      'Koa'
    ],
    aliases: [
      'NodeJS',
      'Node',
      'Node JS'
    ],
    qualifiesFor: [
      'Backend Development',
      'API Development',
      'Server-side JavaScript'
    ]
  },
  {
    skill: 'Next.js',
    parent: [
      'React',
      'JavaScript'
    ],
    requires: [
      'React',
      'JavaScript'
    ],
    aliases: [
      'NextJS',
      'Next',
      'Nextjs'
    ],
    qualifiesFor: [
      'Full Stack Development',
      'SSR',
      'Frontend Development'
    ]
  },
  // Java Frameworks
  {
    skill: 'Spring',
    parent: [
      'Java',
      'Backend Development'
    ],
    requires: [
      'Java'
    ],
    children: [
      'Spring Boot',
      'Spring Cloud',
      'Spring Security'
    ],
    aliases: [
      'Spring Framework'
    ],
    qualifiesFor: [
      'Backend Development',
      'Enterprise Development',
      'Microservices'
    ]
  },
  {
    skill: 'Spring Boot',
    parent: [
      'Spring',
      'Java'
    ],
    requires: [
      'Java',
      'Spring'
    ],
    aliases: [
      'SpringBoot',
      'Spring-Boot'
    ],
    qualifiesFor: [
      'Backend Development',
      'Microservices',
      'REST APIs'
    ]
  },
  // PHP & Frameworks
  {
    skill: 'PHP',
    children: [
      'Laravel',
      'Symfony',
      'CodeIgniter',
      'Zend Framework',
      'CakePHP'
    ],
    aliases: [
      'PHP 7',
      'PHP 8',
      'php',
      'PHP 5',
      'PHP 7.4',
      'PHP 8.0',
      'PHP 8.1',
      'PHP 8.2'
    ],
    qualifiesFor: [
      'Backend Development',
      'Web Development',
      'Server-side Development'
    ]
  },
  {
    skill: 'Laravel',
    parent: [
      'PHP',
      'Backend Development',
      'Web Development'
    ],
    requires: [
      'PHP'
    ],
    aliases: [
      'Laravel Framework',
      'Laravel PHP',
      'laravel'
    ],
    qualifiesFor: [
      'Backend Development',
      'API Development',
      'Web Development',
      'MVC Development'
    ]
  },
  {
    skill: 'Symfony',
    parent: [
      'PHP',
      'Backend Development'
    ],
    requires: [
      'PHP'
    ],
    aliases: [
      'Symfony Framework',
      'symfony'
    ],
    qualifiesFor: [
      'Backend Development',
      'API Development',
      'Web Development'
    ]
  },
  // Databases
  {
    skill: 'PostgreSQL',
    parent: [
      'SQL',
      'Databases'
    ],
    aliases: [
      'Postgres',
      'PostGIS',
      'PgSQL',
      'PostgresSQL'
    ],
    qualifiesFor: [
      'Database Management',
      'Backend Development',
      'Data Engineering'
    ]
  },
  {
    skill: 'MySQL',
    parent: [
      'SQL',
      'Databases'
    ],
    aliases: [
      'My SQL',
      'MariaDB'
    ],
    qualifiesFor: [
      'Database Management',
      'Backend Development'
    ]
  },
  {
    skill: 'MongoDB',
    parent: [
      'NoSQL',
      'Databases'
    ],
    aliases: [
      'Mongo',
      'Mongo DB'
    ],
    qualifiesFor: [
      'NoSQL Database',
      'Backend Development',
      'Document Database'
    ]
  },
  {
    skill: 'Redis',
    parent: [
      'NoSQL',
      'Databases',
      'Caching'
    ],
    aliases: [
      'Redis Cache',
      'Redis DB'
    ],
    qualifiesFor: [
      'Caching',
      'Session Management',
      'Message Queue'
    ]
  },
  // Cloud Platforms
  {
    skill: 'AWS',
    parent: [
      'Cloud Computing',
      'DevOps'
    ],
    children: [
      'EC2',
      'S3',
      'Lambda',
      'RDS',
      'DynamoDB',
      'CloudFormation',
      'ECS',
      'EKS'
    ],
    aliases: [
      'Amazon Web Services',
      'Amazon AWS'
    ],
    qualifiesFor: [
      'Cloud Computing',
      'DevOps',
      'Infrastructure',
      'Cloud Architecture'
    ]
  },
  {
    skill: 'Azure',
    parent: [
      'Cloud Computing',
      'DevOps'
    ],
    children: [
      'Azure Functions',
      'Azure DevOps',
      'Azure Storage',
      'Azure SQL'
    ],
    aliases: [
      'Microsoft Azure',
      'MS Azure'
    ],
    qualifiesFor: [
      'Cloud Computing',
      'DevOps',
      'Infrastructure'
    ]
  },
  {
    skill: 'Google Cloud',
    parent: [
      'Cloud Computing',
      'DevOps'
    ],
    children: [
      'GCE',
      'Cloud Functions',
      'BigQuery',
      'Cloud Storage'
    ],
    aliases: [
      'GCP',
      'Google Cloud Platform',
      'GCloud'
    ],
    qualifiesFor: [
      'Cloud Computing',
      'DevOps',
      'Infrastructure'
    ]
  },
  // DevOps & Tools
  {
    skill: 'Docker',
    parent: [
      'DevOps',
      'Containerization'
    ],
    aliases: [
      'docker-compose',
      'Docker Compose'
    ],
    qualifiesFor: [
      'DevOps',
      'Containerization',
      'Microservices'
    ]
  },
  {
    skill: 'Kubernetes',
    parent: [
      'DevOps',
      'Container Orchestration'
    ],
    requires: [
      'Docker'
    ],
    aliases: [
      'K8s',
      'K8',
      'Kube'
    ],
    qualifiesFor: [
      'DevOps',
      'Container Orchestration',
      'Cloud Native'
    ]
  },
  {
    skill: 'Git',
    parent: [
      'Version Control'
    ],
    children: [
      'GitHub',
      'GitLab',
      'Bitbucket'
    ],
    aliases: [
      'git',
      'GIT'
    ],
    qualifiesFor: [
      'Version Control',
      'Source Control',
      'Collaboration'
    ]
  },
  // High-level Categories
  {
    skill: 'Frontend Development',
    children: [
      'React',
      'Vue',
      'Angular',
      'HTML',
      'CSS',
      'JavaScript'
    ],
    aliases: [
      'Front-end Development',
      'Client-side Development',
      'UI Development'
    ],
    qualifiesFor: [
      'Web Development',
      'Full Stack Development'
    ]
  },
  {
    skill: 'Backend Development',
    children: [
      'Node.js',
      'Python',
      'Java',
      'C#',
      'Ruby',
      'PHP',
      'Go'
    ],
    aliases: [
      'Back-end Development',
      'Server-side Development'
    ],
    qualifiesFor: [
      'Web Development',
      'Full Stack Development',
      'API Development'
    ]
  },
  {
    skill: 'Full Stack Development',
    requires: [
      'Frontend Development',
      'Backend Development'
    ],
    aliases: [
      'Fullstack Development',
      'Full-Stack Development'
    ],
    qualifiesFor: [
      'Web Development',
      'Software Development'
    ]
  },
  {
    skill: 'Cloud Computing',
    children: [
      'AWS',
      'Azure',
      'Google Cloud',
      'Cloud Architecture'
    ],
    aliases: [
      'Cloud Technologies',
      'Cloud Services',
      'Cloud Platforms'
    ],
    qualifiesFor: [
      'Infrastructure',
      'DevOps',
      'Scalable Systems'
    ]
  },
  // Certifications
  {
    skill: 'AWS Certified Solutions Architect',
    aliases: [
      'AWS Solutions Architect',
      'SAA-C03',
      'SAA-C02',
      'AWS SA'
    ],
    qualifiesFor: [
      'Cloud Architecture',
      'AWS',
      'Cloud Computing'
    ]
  },
  {
    skill: 'AWS Certified Developer',
    aliases: [
      'AWS Developer Associate',
      'DVA-C02',
      'AWS Dev'
    ],
    qualifiesFor: [
      'AWS',
      'Cloud Development'
    ]
  },
  {
    skill: 'Microsoft Azure Fundamentals',
    aliases: [
      'AZ-900',
      'Azure Fundamentals'
    ],
    qualifiesFor: [
      'Azure',
      'Cloud Computing'
    ]
  },
  {
    skill: 'Google Cloud Professional',
    aliases: [
      'GCP Professional',
      'Google Cloud Certified'
    ],
    qualifiesFor: [
      'GCP',
      'Cloud Computing'
    ]
  },
  {
    skill: 'PMP',
    aliases: [
      'Project Management Professional',
      'PMI PMP'
    ],
    qualifiesFor: [
      'Project Management',
      'Leadership'
    ]
  },
  // Roles and Job Titles
  // Added: 2025-01-04 23:35 - Common role titles and their variations for better matching
  {
    skill: 'Tech Lead',
    aliases: [
      'Technical Lead',
      'Tech Leader',
      'Technical Leader',
      'Lead Developer',
      'Lead Engineer'
    ],
    qualifiesFor: [
      'Leadership',
      'Technical Leadership',
      'Team Management'
    ],
    requires: [
      'Software Development',
      'Leadership'
    ]
  },
  {
    skill: 'Chief Technology Officer',
    aliases: [
      'CTO',
      'Chief Technology & Development Officer',
      'Chief Tech Officer'
    ],
    qualifiesFor: [
      'Executive Leadership',
      'Technology Strategy',
      'Tech Lead'
    ],
    requires: [
      'Leadership',
      'Software Development'
    ]
  },
  {
    skill: 'Head Software Development',
    aliases: [
      'Head of Software Development',
      'Head of Engineering',
      'Head of Development',
      'Engineering Head'
    ],
    qualifiesFor: [
      'Tech Lead',
      'Engineering Management',
      'Leadership'
    ],
    requires: [
      'Software Development',
      'Leadership'
    ]
  },
  {
    skill: 'Software Engineer',
    aliases: [
      'Software Developer',
      'Programmer',
      'Developer',
      'SWE',
      'Freelance Software Developer'
    ],
    qualifiesFor: [
      'Software Development',
      'Programming'
    ],
    requires: [
      'Programming'
    ]
  },
  {
    skill: 'Product Manager',
    aliases: [
      'PM',
      'Product Owner',
      'PO'
    ],
    qualifiesFor: [
      'Product Management',
      'Product Strategy'
    ],
    requires: [
      'Product Management'
    ]
  },
  {
    skill: 'Founder',
    aliases: [
      'Co-Founder',
      'Co Founder',
      'Founding Member'
    ],
    qualifiesFor: [
      'Leadership',
      'Entrepreneurship',
      'Business Strategy'
    ],
    requires: [
      'Leadership'
    ]
  },
  // Soft Skills
  {
    skill: 'Leadership',
    aliases: [
      'Team Leadership',
      'People Management',
      'Team Management'
    ],
    qualifiesFor: [
      'Management',
      'People Skills',
      'Soft Skills'
    ]
  },
  {
    skill: 'Communication',
    aliases: [
      'Communication Skills',
      'Verbal Communication',
      'Written Communication'
    ],
    qualifiesFor: [
      'Interpersonal Skills',
      'Soft Skills'
    ]
  },
  {
    skill: 'Problem Solving',
    aliases: [
      'Problem-Solving',
      'Analytical Thinking',
      'Critical Thinking'
    ],
    qualifiesFor: [
      'Analytical Skills',
      'Soft Skills'
    ]
  },
  {
    skill: 'Teamwork',
    aliases: [
      'Team Collaboration',
      'Team Player',
      'Collaboration'
    ],
    qualifiesFor: [
      'Interpersonal Skills',
      'Soft Skills'
    ]
  },
  {
    skill: 'Project Management',
    aliases: [
      'Project Coordination',
      'Project Planning',
      'Program Management'
    ],
    qualifiesFor: [
      'Management',
      'Planning',
      'Soft Skills'
    ]
  }
];
/**
 * Helper class to work with skill registry
 */ export class SkillRegistry {
  skillMap;
  aliasMap;
  // alias -> canonical skill name
  constructor(skills = SOFTWARE_SKILLS_REGISTRY){
    this.skillMap = new Map();
    this.aliasMap = new Map();
    // Build skill map and alias map
    for (const skill of skills){
      const canonical = this.normalizeSkill(skill.skill);
      this.skillMap.set(canonical, skill);
      // Map all aliases to canonical name
      for (const alias of skill.aliases){
        this.aliasMap.set(this.normalizeSkill(alias), canonical);
      }
      // Also map the skill name itself
      this.aliasMap.set(canonical, canonical);
    }
  }
  /**
   * Normalize skill name for comparison
   */ normalizeSkill(skill) {
    return skill.toLowerCase().trim().replace(/[\s\-_\.]/g, '');
  }
  /**
   * Find canonical skill name from potential alias
   */ findCanonicalSkill(skillName) {
    const normalized = this.normalizeSkill(skillName);
    const canonical = this.aliasMap.get(normalized);
    if (canonical) {
      const skill = this.skillMap.get(canonical);
      return skill ? skill.skill : null;
    }
    return null;
  }
  /**
   * Check if two skills are aliases of each other
   */ areAliases(skill1, skill2) {
    const canonical1 = this.findCanonicalSkill(skill1);
    const canonical2 = this.findCanonicalSkill(skill2);
    return canonical1 !== null && canonical1 === canonical2;
  }
  /**
   * Check if candidateSkill is a child of requiredSkill
   * E.g., Django is a child of Python
   */ isChildOf(candidateSkill, requiredSkill) {
    const canonical = this.findCanonicalSkill(candidateSkill);
    if (!canonical) return false;
    const skill = this.skillMap.get(this.normalizeSkill(canonical));
    if (!skill || !skill.parent) return false;
    // Check if requiredSkill is in parent list
    const requiredCanonical = this.findCanonicalSkill(requiredSkill);
    if (!requiredCanonical) return false;
    return skill.parent.some((parent)=>this.areAliases(parent, requiredCanonical));
  }
  /**
   * Check if candidateSkill is a parent of requiredSkill
   * E.g., Python is a parent of Django
   */ isParentOf(candidateSkill, requiredSkill) {
    const canonical = this.findCanonicalSkill(candidateSkill);
    if (!canonical) return false;
    const skill = this.skillMap.get(this.normalizeSkill(canonical));
    if (!skill || !skill.children) return false;
    // Check if requiredSkill is in children list
    const requiredCanonical = this.findCanonicalSkill(requiredSkill);
    if (!requiredCanonical) return false;
    return skill.children.some((child)=>this.areAliases(child, requiredCanonical));
  }
  /**
   * Check if candidateSkill qualifies for requirement
   */ qualifiesFor(candidateSkill, requirement) {
    const canonical = this.findCanonicalSkill(candidateSkill);
    if (!canonical) return false;
    const skill = this.skillMap.get(this.normalizeSkill(canonical));
    if (!skill || !skill.qualifiesFor) return false;
    const reqCanonical = this.findCanonicalSkill(requirement);
    if (!reqCanonical) return false;
    return skill.qualifiesFor.some((qual)=>this.areAliases(qual, reqCanonical));
  }
  /**
   * Get all related skills (parents, children, qualifies for)
   */ getRelatedSkills(skillName) {
    const canonical = this.findCanonicalSkill(skillName);
    if (!canonical) return null;
    const skill = this.skillMap.get(this.normalizeSkill(canonical));
    if (!skill) return null;
    return {
      canonical: skill.skill,
      parents: skill.parent || [],
      children: skill.children || [],
      qualifiesFor: skill.qualifiesFor || [],
      requires: skill.requires || []
    };
  }
}
// Export singleton instance
export const skillRegistry = new SkillRegistry(SOFTWARE_SKILLS_REGISTRY);
