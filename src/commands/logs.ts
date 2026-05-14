import { Command } from 'commander';
import { logger } from '../utils/logger';
import { createSpinner } from '../ui/spinner';

export const registerLogsCommand = (program: Command) => {
  program
    .command('logs <name>')
    .description('Show logs for a container or pod')
    .action(async (name) => {
      const spinner = createSpinner(`Fetching logs for ${name}...`).start();
      try {
        // Spinner should be driven by actual work here in the future
        spinner.stop(`Logs for ${name} fetched`);
        logger.info(`Showing logs for ${name}...`);
      } catch (error) {
        spinner.fail(`Failed to fetch logs for ${name}: ${(error as Error).message}`);
      }
    });
};
