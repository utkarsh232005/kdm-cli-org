import { program } from 'commander';
import chalk from 'chalk';
import { checkDockerConnection } from '../docker/client';
import { checkK8sConnection } from '../kubernetes/client';
import { checkMinikubeConnection } from '../minikube/client';
import { registerShowCommand } from './show';
import { registerHealthCommand } from './health';
import { registerWatchCommand } from './watch';
import { registerLogsCommand } from './logs';
import { logger } from '../utils/logger';
import { showWelcomeBanner } from '../ui/banner';

program
  .name('kdm')
  .description('Kubernetes and Docker Monitoring CLI')
  .version('0.9.9');

// Register modular commands
registerShowCommand(program);
registerHealthCommand(program);
registerWatchCommand(program);
registerLogsCommand(program);

const run = async () => {
  if (!process.argv.slice(2).length) {
    showWelcomeBanner('0.9.9');

    const [dockerStatus, k8sStatus, minikubeStatus] = await Promise.all([
      checkDockerConnection(),
      checkK8sConnection(),
      checkMinikubeConnection()
    ]);

    const dockerStr = dockerStatus.connected ? chalk.green('Connected') : chalk.red('Disconnected');
    const k8sStr = k8sStatus.connected ? chalk.green('Connected') : chalk.red('Disconnected');
    
    let minikubeStr = chalk.red('Not Installed');
    if (minikubeStatus.installed) {
      minikubeStr = minikubeStatus.running ? chalk.green('Running') : chalk.yellow('Stopped');
    }

    console.log(`Docker: ${dockerStr}`);
    console.log(`Kubernetes: ${k8sStr}`);
    console.log(`Minikube: ${minikubeStr}\n`);
    console.log(`Running Containers: ${chalk.yellow(dockerStatus.containerCount)}`);
    console.log(`Running Pods: ${chalk.yellow(k8sStatus.podCount)}`);
    console.log(`Unhealthy Services: ${chalk.yellow('0')} (Mocked)\n`);
    console.log(chalk.bold('Commands:\n'));
    console.log(`  kdm show runners\n  kdm health all\n  kdm watch\n  kdm logs <name>\n`);
    
    program.outputHelp();
    process.exit(0);
  }

  program.parse(process.argv);
};

run();


