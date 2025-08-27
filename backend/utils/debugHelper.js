// utils/debugHelper.js - Debug utilities for troubleshooting

export const debugJobBoard = {
  // Test API connectivity
  async testAPIConnection() {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    try {
      const response = await fetch(`${baseURL}/api/jobs`);
      const data = await response.json();
      
      console.log('🔍 API Connection Test Results:');
      console.log('Status:', response.status);
      console.log('Success:', data.success);
      console.log('Jobs Count:', data.count);
      console.log('Jobs Data:', data.data);
      
      return {
        connected: response.ok,
        status: response.status,
        data: data
      };
    } catch (error) {
      console.error('❌ API Connection Failed:', error);
      return { connected: false, error: error.message };
    }
  },

  // Test database query directly (backend only)
  async testDatabaseQuery(Job) {
    try {
      console.log('🔍 Testing Database Query...');
      
      // Test with both filter conditions
      const allJobs = await Job.find({});
      const visibleJobs = await Job.find({ isVisible: { $ne: false } });
      const approvedJobs = await Job.find({ status: 'approved', isVisible: true });
      
      console.log('Total jobs in DB:', allJobs.length);
      console.log('Visible jobs:', visibleJobs.length);
      console.log('Approved + Visible jobs:', approvedJobs.length);
      
      // Log first few jobs for inspection
      if (allJobs.length > 0) {
        console.log('Sample job data:', {
          _id: allJobs[0]._id,
          title: allJobs[0].title,
          company: allJobs[0].company,
          status: allJobs[0].status,
          isVisible: allJobs[0].isVisible,
          createdAt: allJobs[0].createdAt
        });
      }
      
      return {
        total: allJobs.length,
        visible: visibleJobs.length,
        approved: approvedJobs.length,
        sample: allJobs[0]
      };
    } catch (error) {
      console.error('❌ Database Query Failed:', error);
      return { error: error.message };
    }
  },

  // Frontend state inspector
  inspectReduxState(state) {
    console.log('🔍 Redux Jobs State:', {
      items: state.jobs.items,
      itemsCount: state.jobs.items?.length || 0,
      loading: state.jobs.loading,
      error: state.jobs.error,
      lastFetched: state.jobs.lastFetched
    });
    
    return state.jobs;
  },

  // Test specific job filters
  testJobFilters(jobs, filters = {}) {
    console.log('🔍 Testing Job Filters...');
    console.log('Original jobs count:', jobs?.length || 0);
    
    if (!jobs || jobs.length === 0) {
      console.log('❌ No jobs to filter');
      return [];
    }

    const { search = '', company = '', location = '' } = filters;
    
    const filtered = jobs.filter((job) => {
      if (!job) return false;
      
      const matchesSearch = !search || 
        (job.title && job.title.toLowerCase().includes(search.toLowerCase())) ||
        (job.description && job.description.toLowerCase().includes(search.toLowerCase())) ||
        (job.company && job.company.toLowerCase().includes(search.toLowerCase()));
      
      const matchesCompany = !company || job.company === company;
      const matchesLocation = !location || job.jobLocation === location;
      
      return matchesSearch && matchesCompany && matchesLocation;
    });

    console.log('Filtered jobs count:', filtered.length);
    console.log('Applied filters:', { search, company, location });
    
    return filtered;
  },

  // Check for common issues
  diagnoseIssues(jobs) {
    const issues = [];
    
    if (!jobs) {
      issues.push('Jobs array is null/undefined');
    } else if (!Array.isArray(jobs)) {
      issues.push('Jobs is not an array');
    } else if (jobs.length === 0) {
      issues.push('Jobs array is empty');
    } else {
      // Check job structure
      const firstJob = jobs[0];
      if (!firstJob._id) issues.push('Jobs missing _id field');
      if (!firstJob.title) issues.push('Jobs missing title field');
      if (!firstJob.company) issues.push('Jobs missing company field');
      if (firstJob.isVisible === false) issues.push('Some jobs have isVisible = false');
      if (firstJob.status && firstJob.status !== 'approved') {
        issues.push(`Some jobs have status: ${firstJob.status} (not approved)`);
      }
    }
    
    if (issues.length > 0) {
      console.log('❌ Issues found:', issues);
    } else {
      console.log('✅ No issues detected');
    }
    
    return issues;
  }
};

// Export for use in components
export default debugJobBoard;

// Quick debug function to call from browser console
if (typeof window !== 'undefined') {
  window.debugJobBoard = debugJobBoard;
}