import { program } from 'commander';
import chalk from 'chalk';
import { checkDockerConnection } from '../docker/client';
import { checkK8sConnection } from '../kubernetes/client';

program
  .name('kdm')
  .description('Kubernetes and Docker Monitoring CLI')
  .version('1.0.0');

program
  .command('show <target>')
  .description('Show running runners, pods, or containers')
  .action((target) => {
    console.log(`Showing ${target}...`);
  });

program
  .command('health <target>')
  .description('Show health status')
  .action((target) => {
    console.log(`Showing health for ${target}...`);
  });

program
  .command('watch')
  .description('Live monitoring mode')
  .action(() => {
    console.log('Starting live monitoring...');
  });

program
  .command('logs <name>')
  .description('Show logs for a container or pod')
  .action((name) => {
    console.log(`Showing logs for ${name}...`);
  });

const run = async () => {
  if (!process.argv.slice(2).length) {
    const [dockerStatus, k8sStatus] = await Promise.all([
      checkDockerConnection(),
      checkK8sConnection()
    ]);

    const dockerStr = dockerStatus.connected ? chalk.green('Connected') : chalk.red('Disconnected');
    const k8sStr = k8sStatus.connected ? chalk.green('Connected') : chalk.red('Disconnected');

    console.log(chalk.bold.blue('KDM v1.0\n'));
    console.log(`Docker: ${dockerStr}`);
    console.log(`Kubernetes: ${k8sStr}\n`);
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

