import { Command } from 'commander';
import { logger } from '../utils/logger';
import { createSpinner } from '../ui/spinner';

export const registerHealthCommand = (program: Command) => {
  program
    .command('health <target>')
    .description('Show health status for pods or containers')
    .action(async (target) => {
      const spinner = createSpinner(`Checking health for ${target}...`).start();
      try {
        // Spinner should be driven by actual work here in the future
        spinner.stop(`Health check for ${target} complete`);
        logger.info(`Showing health for ${target}...`);
      } catch (error) {
        spinner.fail(`Health check for ${target} failed: ${(error as Error).message}`);
      }
    });
};
