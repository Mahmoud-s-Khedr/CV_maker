import axios from 'axios';
import { logError } from '../utils/logger';

interface GitHubRepo {
    name: string;
    description: string;
    html_url: string;
    topics: string[];
    stargazers_count: number;
    fork: boolean;
    language: string;
}

export const fetchUserRepos = async (username: string, limit: number = 10) => {
    try {
        const response = await axios.get<GitHubRepo[]>(
            `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`,
            {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'CV-Maker-App'
                }
            }
        );

        // Filter out forks and sort by stars/best work
        // Taking non-forks is usually better for portfolios, but sometimes people want to show off contributions.
        // Let's prefer non-forks, but if that list is small, maybe include forks.
        // For now, let's just filter non-forks and sort by stars.
        let repos = response.data.filter(repo => !repo.fork);

        // Sort by stars descending
        repos = repos.sort((a, b) => b.stargazers_count - a.stargazers_count);

        // Take top N
        repos = repos.slice(0, limit);

        // Map to our ProjectItem structure
        return repos.map(repo => ({
            name: repo.name,
            description: repo.description || 'No description available',
            url: repo.html_url,
            technologies: repo.topics && repo.topics.length > 0
                ? repo.topics
                : (repo.language ? [repo.language] : []),
            highlights: [`${repo.stargazers_count} Stars on GitHub`]
        }));
    } catch (error) {
        logError(error as Error, { context: 'github.fetchUserRepos', username });
        throw new Error('Failed to fetch repositories from GitHub');
    }
};
