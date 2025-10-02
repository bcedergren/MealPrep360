#!/usr/bin/env node

import { execSync } from 'child_process';
import { performance } from 'perf_hooks';

interface TestSuite {
  name: string;
  path: string;
  type: 'unit' | 'integration' | 'e2e' | 'api' | 'performance';
  timeout: number;
  parallel: boolean;
}

interface TestResult {
  suite: string;
  type: string;
  passed: boolean;
  duration: number;
  tests: number;
  failures: number;
  errors: string[];
}

class ComprehensiveTestRunner {
  private testSuites: TestSuite[] = [
    {
      name: 'Service Communication Unit Tests',
      path: 'src/tests/unit/service-communication.test.ts',
      type: 'unit',
      timeout: 30000,
      parallel: true
    },
    {
      name: 'Service Integration Tests',
      path: 'src/tests/integration/service-integration.test.ts',
      type: 'integration',
      timeout: 60000,
      parallel: true
    },
    {
      name: 'End-to-End Tests',
      path: 'src/tests/e2e/end-to-end.test.ts',
      type: 'e2e',
      timeout: 120000,
      parallel: false
    },
    {
      name: 'API Endpoint Tests',
      path: 'src/tests/api/api-endpoints.test.ts',
      type: 'api',
      timeout: 90000,
      parallel: true
    },
    {
      name: 'Performance and Load Tests',
      path: 'src/tests/performance/load-testing.test.ts',
      type: 'performance',
      timeout: 180000,
      parallel: false
    }
  ];

  private results: TestResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Comprehensive Test Suite...\n');
    console.log(`📋 Running ${this.testSuites.length} test suites\n`);

    const startTime = performance.now();

    try {
      // Run unit and integration tests in parallel
      const parallelSuites = this.testSuites.filter(suite => suite.parallel);
      const sequentialSuites = this.testSuites.filter(suite => !suite.parallel);

      // Run parallel tests
      if (parallelSuites.length > 0) {
        console.log('🔄 Running parallel test suites...');
        await this.runTestSuitesInParallel(parallelSuites);
      }

      // Run sequential tests
      if (sequentialSuites.length > 0) {
        console.log('🔄 Running sequential test suites...');
        await this.runTestSuitesSequentially(sequentialSuites);
      }

      const endTime = performance.now();
      const totalDuration = endTime - startTime;

      this.displayResults(totalDuration);
    } catch (error) {
      console.error('❌ Test suite execution failed:', error);
      process.exit(1);
    }
  }

  private async runTestSuitesInParallel(suites: TestSuite[]): Promise<void> {
    const promises = suites.map(suite => this.runTestSuite(suite));
    await Promise.all(promises);
  }

  private async runTestSuitesSequentially(suites: TestSuite[]): Promise<void> {
    for (const suite of suites) {
      await this.runTestSuite(suite);
    }
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    console.log(`\n🔍 Running ${suite.name}...`);
    const startTime = performance.now();

    try {
      const command = `npx jest ${suite.path} --verbose --timeout=${suite.timeout} --detectOpenHandles`;
      const output = execSync(command, { 
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: 'pipe'
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Parse Jest output to extract test results
      const testResult = this.parseJestOutput(output, suite, duration);
      this.results.push(testResult);

      console.log(`  ✅ ${suite.name} completed in ${Math.round(duration)}ms`);
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      const testResult: TestResult = {
        suite: suite.name,
        type: suite.type,
        passed: false,
        duration,
        tests: 0,
        failures: 1,
        errors: [error instanceof Error ? error.message : String(error)]
      };

      this.results.push(testResult);
      console.log(`  ❌ ${suite.name} failed in ${Math.round(duration)}ms`);
    }
  }

  private parseJestOutput(output: string, suite: TestSuite, duration: number): TestResult {
    const lines = output.split('\n');
    let tests = 0;
    let failures = 0;
    let passed = true;

    // Look for Jest test summary
    for (const line of lines) {
      if (line.includes('Tests:')) {
        const match = line.match(/(\d+) passed/);
        if (match) {
          tests = parseInt(match[1]);
        }
      }
      if (line.includes('failed')) {
        const match = line.match(/(\d+) failed/);
        if (match) {
          failures = parseInt(match[1]);
          passed = false;
        }
      }
    }

    return {
      suite: suite.name,
      type: suite.type,
      passed,
      duration,
      tests,
      failures,
      errors: []
    };
  }

  private displayResults(totalDuration: number): void {
    console.log('\n📊 Test Results Summary');
    console.log('========================\n');

    const totalTests = this.results.reduce((sum, result) => sum + result.tests, 0);
    const totalFailures = this.results.reduce((sum, result) => sum + result.failures, 0);
    const passedSuites = this.results.filter(result => result.passed).length;
    const totalSuites = this.results.length;

    console.log(`Total Test Suites: ${totalSuites}`);
    console.log(`Passed Suites: ${passedSuites}`);
    console.log(`Failed Suites: ${totalSuites - passedSuites}`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Total Failures: ${totalFailures}`);
    console.log(`Success Rate: ${Math.round((passedSuites / totalSuites) * 100)}%`);
    console.log(`Total Duration: ${Math.round(totalDuration)}ms\n`);

    // Display results by test type
    const types = [...new Set(this.results.map(result => result.type))];
    types.forEach(type => {
      const typeResults = this.results.filter(result => result.type === type);
      const typePassed = typeResults.filter(result => result.passed).length;
      const typeTests = typeResults.reduce((sum, result) => sum + result.tests, 0);
      const typeFailures = typeResults.reduce((sum, result) => sum + result.failures, 0);

      console.log(`${type.toUpperCase()} Tests:`);
      console.log(`  Suites: ${typePassed}/${typeResults.length} passed`);
      console.log(`  Tests: ${typeTests - typeFailures}/${typeTests} passed`);
      console.log(`  Failures: ${typeFailures}`);
      console.log('');
    });

    // Display individual suite results
    console.log('📋 Individual Suite Results:');
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const duration = Math.round(result.duration);
      console.log(`  ${status} ${result.suite} (${duration}ms)`);
      console.log(`    Tests: ${result.tests}, Failures: ${result.failures}`);
      
      if (result.errors.length > 0) {
        console.log(`    Errors: ${result.errors.join(', ')}`);
      }
    });

    // Display recommendations
    console.log('\n💡 Recommendations:');
    
    const failedSuites = this.results.filter(result => !result.passed);
    if (failedSuites.length > 0) {
      console.log('1. Fix failing test suites:');
      failedSuites.forEach(suite => {
        console.log(`   - ${suite.suite}: ${suite.errors.join(', ')}`);
      });
    }

    const slowSuites = this.results.filter(result => result.duration > 60000);
    if (slowSuites.length > 0) {
      console.log('2. Optimize slow test suites:');
      slowSuites.forEach(suite => {
        console.log(`   - ${suite.suite}: ${Math.round(suite.duration)}ms`);
      });
    }

    if (totalFailures === 0) {
      console.log('✅ All tests passed! Your application is working correctly.');
    } else {
      console.log(`⚠️  ${totalFailures} test(s) failed. Please review and fix the issues above.`);
    }

    console.log('\n🎉 Test execution complete!');
  }
}

// CLI execution
if (require.main === module) {
  const runner = new ComprehensiveTestRunner();
  runner.runAllTests().catch((error) => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export default ComprehensiveTestRunner;
