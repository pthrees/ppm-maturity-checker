// Script to push code to GitHub repository
import { getUncachableGitHubClient } from '../server/github';

async function pushToGitHub() {
  try {
    const octokit = await getUncachableGitHubClient();
    
    // Get authenticated user info
    const { data: user } = await octokit.users.getAuthenticated();
    console.log('Authenticated as:', user.login);
    
    const repoName = 'ppm-maturity-checker';
    const org = 'pthrees';
    
    // Try to create the repository under the organization
    try {
      const { data: repo } = await octokit.repos.createInOrg({
        org: org,
        name: repoName,
        description: 'P3 PPM Maturity Checker - プロジェクト管理成熟度診断ツール',
        private: false,
        auto_init: false,
      });
      console.log('Repository created:', repo.html_url);
    } catch (createError: any) {
      if (createError.status === 422) {
        console.log('Repository already exists, will push to existing repo');
      } else {
        throw createError;
      }
    }
    
    console.log(`\nRepository URL: https://github.com/${org}/${repoName}`);
    console.log('\nTo push your code, run the following commands in the shell:');
    console.log('---');
    console.log(`git remote add github https://github.com/${org}/${repoName}.git`);
    console.log('git push -u github main');
    console.log('---');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

pushToGitHub();
