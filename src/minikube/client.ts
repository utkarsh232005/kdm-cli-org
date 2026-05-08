import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const checkMinikubeConnection = async (): Promise<{ installed: boolean; running: boolean }> => {
  try {
    // Check if minikube is installed
    await execAsync('minikube version');
    
    try {
      // Check if minikube is running
      const { stdout } = await execAsync('minikube status');
      const isRunning = stdout.includes('host: Running') || stdout.includes('apiserver: Running');
      return {
        installed: true,
        running: isRunning,
      };
    } catch (e) {
      // minikube status usually exits with non-zero when stopped
      return {
        installed: true,
        running: false,
      };
    }
  } catch (error) {
    // minikube is not installed
    return {
      installed: false,
      running: false,
    };
  }
};

export const getMinikubeStatus = async (): Promise<any[]> => {
  try {
    const { stdout } = await execAsync('minikube status -o json');
    const lines = stdout.split('\n').filter(Boolean);
    const result = [];
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.Name) {
          result.push(parsed);
        }
      } catch (e) {
        // ignore parsing errors
      }
    }
    return result;
  } catch (error: any) {
    // If it fails (e.g. exit code 85), minikube might be stopped.
    // We can try to parse the stdout to see if it returned JSON info
    if (error.stdout) {
       const lines = error.stdout.split('\n').filter(Boolean);
       for (const line of lines) {
         try {
           const parsed = JSON.parse(line);
           if (parsed.data && parsed.data.message) {
             return [{ Name: 'minikube', Host: 'Stopped', Message: parsed.data.message }];
           }
         } catch(e) {}
       }
    }
    return [{ Name: 'minikube', Host: 'Stopped', Message: 'Not running' }];
  }
};

