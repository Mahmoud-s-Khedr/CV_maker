import type { ResumeSchema } from '../types/resume';

export const DUMMY_RESUME: ResumeSchema = {
    meta: {
        templateId: 'standard',
        themeConfig: {
            primaryColor: '#000000',
            fontFamily: 'Helvetica',
            spacing: 'standard'
        }
    },
    profile: {
        fullName: 'Alexander J. Thompson',
        jobTitle: 'Senior Full Stack Engineer',
        email: 'alex.thompson@example.com',
        phone: '+1 (415) 555-0198',
        location: 'San Francisco, Bay Area',
        url: 'linkedin.com/in/alexthompson-dev',
        summary: 'Results-oriented Senior Software Engineer with over 8 years of experience in designing and scaling distributed web applications. specialized in the Modern JavaScript Stack (React, Node.js, TypeScript) and Cloud Architecture (AWS). Proven track record of improving system performance by 40% and leading cross-functional teams to successful product launches. Passionate about code quality, developer tooling, and opensource contributions.'
    },
    sections: [
        {
            id: 'exp_section',
            type: 'experience',
            title: 'Professional Experience',
            isVisible: true,
            columns: 1,
            items: [
                {
                    id: 'exp_1',
                    company: 'TechFlow Systems',
                    position: 'Senior Software Engineer',
                    location: 'San Francisco, CA',
                    startDate: '2021-03',
                    endDate: 'Present',
                    description: 'Leading the core platform team of 6 engineers. Responsible for the architecture and development of the company’s flagship SaaS product serving 50k+ enterprise users.',
                    highlights: [
                        'Spearheaded the migration from a monolithic architecture to microservices using Node.js and Kubernetes, resulting in a 50% reduction in deployment time.',
                        'Optimized high-traffic API endpoints, reducing P99 latency from 500ms to 80ms.',
                        'Implemented a rigorous CI/CD pipeline ensuring 99.9% uptime and zero-downtime deployments.',
                        'Mentored 3 junior developers to promotion within 18 months.'
                    ]
                },
                {
                    id: 'exp_2',
                    company: 'Innovate Digital',
                    position: 'Software Engineer',
                    location: 'Austin, TX',
                    startDate: '2018-06',
                    endDate: '2021-02',
                    description: 'Full stack development for a high-growth fintech startup. Collaborated closely with product and design teams to iterate on user-facing features.',
                    highlights: [
                        'Built and launched a real-time fraud detection system using Python and React, saving the company $100k annually.',
                        'Developed a responsive mobile-first dashboard used by 10k daily active users.',
                        'Integrated Stripe and Plaid APIs for seamless payment processing and bank account verification.'
                    ]
                },
                {
                    id: 'exp_3',
                    company: 'Creative Web Agency',
                    position: 'Junior Web Developer',
                    location: 'Remote',
                    startDate: '2016-05',
                    endDate: '2018-05',
                    description: 'Developed custom WordPress themes and plugins for a diverse range of clients, ensuring high performance and SEO optimization.',
                    highlights: [
                        'Delivered over 30 client websites with a 100% satisfaction rate.',
                        'Automated image optimization workflows, improved page load speeds by 30%.'
                    ]
                }
            ]
        },
        {
            id: 'edu_section',
            type: 'education',
            title: 'Education',
            isVisible: true,
            columns: 1,
            items: [
                {
                    id: 'edu_1',
                    institution: 'University of California, Berkeley',
                    degree: 'Master of Science',
                    field: 'Computer Science',
                    location: 'Berkeley, CA',
                    startDate: '2014',
                    endDate: '2016',
                    highlights: [
                        'Specialization in Distributed Systems',
                        'Thesis: "Optimizing Consensus Algorithms in Low-Bandwidth Networks"'
                    ]
                },
                {
                    id: 'edu_2',
                    institution: 'University of Texas at Austin',
                    degree: 'Bachelor of Science',
                    field: 'Computer Engineering',
                    location: 'Austin, TX',
                    startDate: '2010',
                    endDate: '2014',
                    highlights: [
                        'Dean’s List All Semesters',
                        'President of the IEEE Student Branch (2013-2014)'
                    ]
                }
            ]
        },
        {
            id: 'skills_section',
            type: 'skills',
            title: 'Technical Skills',
            isVisible: true,
            columns: 1,
            items: [
                { id: 'sk_1', name: 'TypeScript / JavaScript', level: 'expert', category: 'Languages' },
                { id: 'sk_2', name: 'Python', level: 'advanced', category: 'Languages' },
                { id: 'sk_3', name: 'Go', level: 'intermediate', category: 'Languages' },
                { id: 'sk_4', name: 'React & React Native', level: 'expert', category: 'Frontend' },
                { id: 'sk_5', name: 'Next.js', level: 'expert', category: 'Frontend' },
                { id: 'sk_6', name: 'Tailwind CSS', level: 'advanced', category: 'Frontend' },
                { id: 'sk_7', name: 'Node.js', level: 'expert', category: 'Backend' },
                { id: 'sk_8', name: 'PostgreSQL', level: 'advanced', category: 'Backend' },
                { id: 'sk_9', name: 'GraphQL', level: 'advanced', category: 'Backend' },
                { id: 'sk_10', name: 'AWS (EC2, S3, Lambda)', level: 'advanced', category: 'DevOps' },
                { id: 'sk_11', name: 'Docker & Kubernetes', level: 'intermediate', category: 'DevOps' },
                { id: 'sk_12', name: 'CI/CD (GitHub Actions)', level: 'advanced', category: 'DevOps' }
            ]
        },
        {
            id: 'proj_section',
            type: 'projects',
            title: 'Key Projects',
            isVisible: true,
            columns: 1,
            items: [
                {
                    id: 'proj_1',
                    name: 'OpenSource UI Library',
                    description: 'A lightweight, accessible React component library focused on developer experience and bundle size.',
                    url: 'github.com/alexthompson/ui-lib',
                    technologies: ['React', 'TypeScript', 'Rollup', 'Jest'],
                    highlights: [
                        'Gained 500+ stars on GitHub within the first 3 months.',
                        'Achieved 95% code coverage and implemented automated visual regression testing.'
                    ]
                },
                {
                    id: 'proj_2',
                    name: 'TaskMaster Pro',
                    description: 'A collaborative project management tool inspired by Trello and Jira.',
                    url: 'taskmaster-demo.com',
                    technologies: ['Vue.js', 'Firebase', 'Vuetify'],
                    highlights: [
                        'Implemented real-time updates using Firestore listeners.',
                        'Supported offline mode with PWA capabilities.'
                    ]
                }
            ]
        },
        {
            id: 'cert_section',
            type: 'certifications',
            title: 'Certifications',
            isVisible: true,
            columns: 1,
            items: [
                {
                    id: 'cert_1',
                    name: 'AWS Certified Solutions Architect – Professional',
                    issuer: 'Amazon Web Services',
                    date: '2023-08',
                    url: 'aws.amazon.com/verification'
                },
                {
                    id: 'cert_2',
                    name: 'Certified Kubernetes Administrator (CKA)',
                    issuer: 'The Linux Foundation',
                    date: '2022-11'
                }
            ]
        },
        {
            id: 'lang_section',
            type: 'languages',
            title: 'Languages',
            isVisible: true,
            columns: 1,
            items: [
                { id: 'lang_1', name: 'English', proficiency: 'native' },
                { id: 'lang_2', name: 'Spanish', proficiency: 'fluent' },
                { id: 'lang_3', name: 'German', proficiency: 'intermediate' }
            ]
        },
        {
            id: 'custom_section',
            type: 'custom',
            title: 'Volunteering',
            isVisible: true,
            columns: 1,
            items: [
                {
                    id: 'cust_1',
                    title: 'Tech Mentor',
                    subtitle: 'Code the Future Non-Profit',
                    date: '2019 - Present',
                    description: 'Mentoring underrepresented high school students in web development fundamentals. Hosting weekly workshops on HTML, CSS, and JavaScript.'
                }
            ]
        }
    ]
};
